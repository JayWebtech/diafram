import { Config } from "@remotion/cli/config";

/**
 * Render worker configuration. The final pipeline target is MP4 / 1080p / 30fps;
 * these are the CLI-side defaults for local renders and stills.
 */
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer("angle");
