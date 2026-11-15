import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.laominimart.pos",
  appName: "Lao Minimart POS",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {},
};

export default config;
