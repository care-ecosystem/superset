/**
 * src/images/index.d.ts
 * Allows TypeScript to accept `import thumbnail from './thumbnail.png'`
 * (Superset's webpack config already handles PNG bundling at runtime).
 */
declare module '*.png' {
  const src: string;
  export default src;
}
