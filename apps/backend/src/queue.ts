// Separate Vercel entrypoint for internal queue processing routes.
// It reuses the Nest app bootstrap while deploying as an independent function.
export { default } from './main';
