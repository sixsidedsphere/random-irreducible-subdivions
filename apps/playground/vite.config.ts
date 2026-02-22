import { defineConfig, loadEnv } from "vite";

const normalizeBasePath = (basePath: string | undefined): string => {
  if (!basePath) {
    return "/";
  }

  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const base = normalizeBasePath(env.PUBLIC_BASE_PATH);

  return { base };
});
