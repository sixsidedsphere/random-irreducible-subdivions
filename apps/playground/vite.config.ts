import { defineConfig } from "vite";

const normalizeBasePath = (basePath: string | undefined): string => {
  if (!basePath) {
    return "/";
  }

  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

const base = normalizeBasePath(process.env.PUBLIC_BASE_PATH);

export default defineConfig({ base });
