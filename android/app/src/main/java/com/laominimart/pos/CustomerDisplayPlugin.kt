package com.laominimart.pos

import android.app.Presentation
import android.content.Context
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Display
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * CustomerPresentation: Native Android Presentation displaying the Customer-Facing UI
 * Runs inside the same app process on the secondary hardware display (Sunmi, iMin, etc.)
 * Because both screens share the same origin (https://localhost), BroadcastChannel and
 * localStorage synchronize seamlessly and in real-time.
 */
class CustomerPresentation(
    context: Context,
    display: Display,
    private val url: String
) : Presentation(context, display) {

    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window?.setBackgroundDrawableResource(android.R.color.black)

        val wv = WebView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.d("CustomerPresentation", "Page finished loading: $url")
                }
            }
        }

        webView = wv
        setContentView(wv)
        wv.loadUrl(url)
    }

    fun loadUrl(newUrl: String) {
        webView?.loadUrl(newUrl)
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        webView?.destroy()
        webView = null
    }
}

/**
 * Capacitor Plugin: CustomerDisplayPlugin
 * Controls secondary display presentation on Android Dual-Screen POS devices.
 */
@CapacitorPlugin(name = "CustomerDisplay")
class CustomerDisplayPlugin : Plugin(), DisplayManager.DisplayListener {

    companion object {
        private const val TAG = "CustomerDisplayPlugin"
        private const val DEFAULT_PATH = "/customer-display"
        private var activePresentation: CustomerPresentation? = null

        /**
         * Static utility to check and launch presentation display from MainActivity
         */
        @JvmStatic
        fun checkAndShowDisplay(context: Context, path: String = DEFAULT_PATH) {
            val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager ?: return
            val secondary = getSecondaryDisplay(displayManager)
            if (secondary != null) {
                showPresentationOnDisplay(context, secondary, path)
            }
        }

        @JvmStatic
        fun getSecondaryDisplay(displayManager: DisplayManager): Display? {
            // 1. Check specialized presentation displays
            val presentationDisplays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)
            if (presentationDisplays.isNotEmpty()) {
                return presentationDisplays[0]
            }

            // 2. Fallback to any second attached display
            val allDisplays = displayManager.displays
            if (allDisplays.size > 1) {
                return allDisplays[1]
            }

            return null
        }

        @JvmStatic
        fun showPresentationOnDisplay(context: Context, display: Display, path: String) {
            Handler(Looper.getMainLooper()).post {
                try {
                    if (activePresentation != null && activePresentation?.isShowing == true) {
                        Log.d(TAG, "Customer presentation is already showing on display ${display.displayId}")
                        return@post
                    }

                    // Capacitor scheme default origin: https://localhost
                    val baseUrl = "https://localhost"
                    val fullUrl = "$baseUrl$path"

                    activePresentation = CustomerPresentation(context, display, fullUrl).apply {
                        show()
                    }
                    Log.i(TAG, "Customer display presentation successfully opened on display ${display.displayId} ($fullUrl)")
                } catch (e: Exception) {
                    Log.e(TAG, "Error displaying customer presentation: ${e.message}", e)
                }
            }
        }

        @JvmStatic
        fun dismissPresentation() {
            Handler(Looper.getMainLooper()).post {
                try {
                    activePresentation?.dismiss()
                    activePresentation = null
                    Log.i(TAG, "Customer presentation dismissed")
                } catch (e: Exception) {
                    Log.e(TAG, "Error dismissing presentation: ${e.message}", e)
                }
            }
        }
    }

    override fun load() {
        super.load()
        val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager
        displayManager?.registerDisplayListener(this, Handler(Looper.getMainLooper()))

        // Auto launch on plugin load if secondary screen is present
        displayManager?.let {
            val secondary = getSecondaryDisplay(it)
            if (secondary != null) {
                showPresentationOnDisplay(context, secondary, DEFAULT_PATH)
            }
        }
    }

    /**
     * Expose openCustomerDisplay to JavaScript / TypeScript
     */
    @PluginMethod
    fun openCustomerDisplay(call: PluginCall) {
        val path = call.getString("path", DEFAULT_PATH) ?: DEFAULT_PATH
        val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager

        if (displayManager == null) {
            call.reject("DisplayManager is not available on this device")
            return
        }

        val secondary = getSecondaryDisplay(displayManager)
        if (secondary == null) {
            call.resolve(JSObject().apply {
                put("success", false)
                put("message", "No secondary presentation display detected")
                put("displaysCount", displayManager.displays.size)
            })
            return
        }

        showPresentationOnDisplay(context, secondary, path)
        call.resolve(JSObject().apply {
            put("success", true)
            put("displayId", secondary.displayId)
            put("displayName", secondary.name)
            put("displaysCount", displayManager.displays.size)
        })
    }

    /**
     * Expose closeCustomerDisplay to JavaScript / TypeScript
     */
    @PluginMethod
    fun closeCustomerDisplay(call: PluginCall) {
        dismissPresentation()
        call.resolve(JSObject().apply {
            put("success", true)
        })
    }

    /**
     * Returns total displays count & secondary display availability
     */
    @PluginMethod
    fun getDisplaysCount(call: PluginCall) {
        val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager
        val count = displayManager?.displays?.size ?: 0
        val hasSecondary = displayManager?.let { getSecondaryDisplay(it) != null } ?: false

        call.resolve(JSObject().apply {
            put("displaysCount", count)
            put("hasSecondaryDisplay", hasSecondary)
        })
    }

    override fun onDisplayAdded(displayId: Int) {
        Log.i(TAG, "Hardware display added: $displayId")
        val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager ?: return
        val secondary = getSecondaryDisplay(displayManager)
        if (secondary != null && (activePresentation == null || activePresentation?.isShowing != true)) {
            showPresentationOnDisplay(context, secondary, DEFAULT_PATH)
        }
    }

    override fun onDisplayRemoved(displayId: Int) {
        Log.i(TAG, "Hardware display removed: $displayId")
        if (activePresentation?.display?.displayId == displayId) {
            dismissPresentation()
        }
    }

    override fun onDisplayChanged(displayId: Int) {
        Log.d(TAG, "Hardware display changed: $displayId")
    }
}
