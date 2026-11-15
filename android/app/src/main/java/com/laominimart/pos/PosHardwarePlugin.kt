package com.laominimart.pos

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Base64
import android.util.Log
import android.view.View
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.util.UUID

@CapacitorPlugin(name = "PosHardware")
class PosHardwarePlugin : Plugin() {

    companion object {
        private const val TAG = "PosHardwarePlugin"
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

        // Standard ESC/POS Cash Drawer kick command
        val KICK_DRAWER_PIN2 = byteArrayOf(0x1B, 0x70, 0x00, 0x19, 0xFA.toByte())
        val KICK_DRAWER_PIN5 = byteArrayOf(0x1B, 0x70, 0x01, 0x19, 0xFA.toByte())
    }

    private val pluginScope = CoroutineScope(Dispatchers.IO)

    /**
     * Send raw ESC/POS bytes (Base64 encoded) to thermal printer via LAN, Bluetooth or USB
     */
    @PluginMethod
    fun printRawBytes(call: PluginCall) {
        val base64Data = call.getString("base64Data")
        if (base64Data.isNullOrEmpty()) {
            call.reject("Data is required (base64Data)")
            return
        }

        val connectionType = call.getString("connectionType", "lan") ?: "lan"
        val ip = call.getString("ip", "192.168.1.200") ?: "192.168.1.200"
        val port = call.getInt("port", 9100) ?: 9100
        val bluetoothMac = call.getString("bluetoothMac")

        pluginScope.launch {
            try {
                val data = Base64.decode(base64Data, Base64.DEFAULT)
                val success = when (connectionType.lowercase()) {
                    "bluetooth" -> printViaBluetooth(bluetoothMac, data)
                    "usb" -> printViaUsb(data)
                    else -> printViaLan(ip, port, data)
                }

                if (success) {
                    call.resolve(JSObject().apply {
                        put("success", true)
                        put("bytesSent", data.size)
                    })
                } else {
                    call.reject("Failed to transmit data to printer ($connectionType)")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in printRawBytes: ${e.message}", e)
                call.reject("Print error: ${e.message}")
            }
        }
    }

    /**
     * Triggers cash drawer pulse kick via connected printer
     */
    @PluginMethod
    fun openCashDrawer(call: PluginCall) {
        val connectionType = call.getString("connectionType", "lan") ?: "lan"
        val ip = call.getString("ip", "192.168.1.200") ?: "192.168.1.200"
        val port = call.getInt("port", 9100) ?: 9100
        val bluetoothMac = call.getString("bluetoothMac")
        val pin = call.getInt("pin", 2) ?: 2

        val cmd = if (pin == 5) KICK_DRAWER_PIN5 else KICK_DRAWER_PIN2

        pluginScope.launch {
            try {
                val success = when (connectionType.lowercase()) {
                    "bluetooth" -> printViaBluetooth(bluetoothMac, cmd)
                    "usb" -> printViaUsb(cmd)
                    else -> printViaLan(ip, port, cmd)
                }

                call.resolve(JSObject().apply {
                    put("success", success)
                    put("drawerPin", pin)
                })
            } catch (e: Exception) {
                Log.e(TAG, "Error opening cash drawer: ${e.message}", e)
                call.reject("Failed to open drawer: ${e.message}")
            }
        }
    }

    /**
     * Lists all paired Bluetooth thermal printers
     */
    @PluginMethod
    fun getBondedBluetoothPrinters(call: PluginCall) {
        try {
            val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            val adapter = bluetoothManager?.adapter ?: BluetoothAdapter.getDefaultAdapter()

            if (adapter == null || !adapter.isEnabled) {
                call.resolve(JSObject().apply {
                    put("devices", JSArray())
                    put("bluetoothEnabled", false)
                })
                return
            }

            val pairedDevices = adapter.bondedDevices
            val deviceList = JSArray()

            for (device in pairedDevices) {
                val obj = JSObject().apply {
                    put("name", device.name ?: "Unknown Device")
                    put("address", device.address)
                    put("bondState", device.bondState)
                }
                deviceList.put(obj)
            }

            call.resolve(JSObject().apply {
                put("devices", deviceList)
                put("bluetoothEnabled", true)
            })
        } catch (e: SecurityException) {
            call.reject("Bluetooth permission not granted: ${e.message}")
        } catch (e: Exception) {
            call.reject("Error fetching Bluetooth devices: ${e.message}")
        }
    }

    /**
     * Native Android Haptic Vibration for touch response
     */
    @PluginMethod
    fun triggerVibration(call: PluginCall) {
        val durationMs = call.getInt("durationMs", 30)?.toLong() ?: 30L

        activity?.runOnUiThread {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                    val vibrator = vibratorManager?.defaultVibrator
                    vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(durationMs)
                    }
                }
                call.resolve(JSObject().apply { put("success", true) })
            } catch (e: Exception) {
                call.resolve(JSObject().apply { put("success", false) })
            }
        }
    }

    /**
     * Toggles Fullscreen Kiosk Immersive Mode
     */
    @PluginMethod
    fun setImmersiveMode(call: PluginCall) {
        val enable = call.getBoolean("enable", true) ?: true
        activity?.runOnUiThread {
            applyImmersiveMode(enable)
            call.resolve(JSObject().apply { put("immersive", enable) })
        }
    }

    private fun applyImmersiveMode(enable: Boolean) {
        val act = activity ?: return
        val window = act.window

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowCompat.setDecorFitsSystemWindows(window, !enable)
            val controller = WindowInsetsControllerCompat(window, window.decorView)
            if (enable) {
                controller.hide(WindowInsetsCompat.Type.systemBars())
                controller.systemBarsBehavior =
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            } else {
                controller.show(WindowInsetsCompat.Type.systemBars())
            }
        } else {
            @Suppress("DEPRECATION")
            if (enable) {
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                )
            } else {
                window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
            }
        }
    }

    // --- Private Printing Drivers ---

    private suspend fun printViaLan(ip: String, port: Int, data: ByteArray): Boolean =
        withContext(Dispatchers.IO) {
            var socket: Socket? = null
            try {
                socket = Socket()
                socket.connect(InetSocketAddress(ip, port), 4000)
                socket.getOutputStream().use { out ->
                    out.write(data)
                    out.flush()
                }
                true
            } catch (e: Exception) {
                Log.e(TAG, "LAN print failed to $ip:$port : ${e.message}")
                false
            } finally {
                try { socket?.close() } catch (_: Exception) {}
            }
        }

    private suspend fun printViaBluetooth(mac: String?, data: ByteArray): Boolean =
        withContext(Dispatchers.IO) {
            if (mac.isNullOrEmpty()) {
                Log.e(TAG, "Bluetooth MAC address is required")
                return@withContext false
            }

            var socket: BluetoothSocket? = null
            try {
                val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
                val adapter = bluetoothManager?.adapter ?: BluetoothAdapter.getDefaultAdapter()
                val device: BluetoothDevice = adapter.getRemoteDevice(mac)

                socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket.connect()
                val out: OutputStream = socket.outputStream
                out.write(data)
                out.flush()
                true
            } catch (e: Exception) {
                Log.e(TAG, "Bluetooth print failed: ${e.message}")
                false
            } finally {
                try { socket?.close() } catch (_: Exception) {}
            }
        }

    private suspend fun printViaUsb(data: ByteArray): Boolean =
        withContext(Dispatchers.IO) {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as? UsbManager
                ?: return@withContext false

            val deviceList = usbManager.deviceList
            if (deviceList.isEmpty()) {
                Log.w(TAG, "No USB devices connected")
                return@withContext false
            }

            // Find thermal printer USB device (Class 7 = Printers)
            var printerDevice: UsbDevice? = null
            for (dev in deviceList.values) {
                for (i in 0 until dev.interfaceCount) {
                    val intf = dev.getInterface(i)
                    if (intf.interfaceClass == UsbConstants.USB_CLASS_PRINTER) {
                        printerDevice = dev
                        break
                    }
                }
                if (printerDevice != null) break
            }

            val target = printerDevice ?: deviceList.values.firstOrNull()
                ?: return@withContext false

            val connection = usbManager.openDevice(target) ?: return@withContext false

            try {
                for (i in 0 until target.interfaceCount) {
                    val intf = target.getInterface(i)
                    for (j in 0 until intf.endpointCount) {
                        val endpoint = intf.getEndpoint(j)
                        if (endpoint.direction == UsbConstants.USB_DIR_OUT) {
                            connection.claimInterface(intf, true)
                            val transferred = connection.bulkTransfer(endpoint, data, data.size, 5000)
                            connection.releaseInterface(intf)
                            return@withContext transferred >= 0
                        }
                    }
                }
                false
            } catch (e: Exception) {
                Log.e(TAG, "USB print failed: ${e.message}")
                false
            } finally {
                connection.close()
            }
        }
}
