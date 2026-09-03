// ===================================================================
// Express Type Extensions
// ===================================================================
// WHY THIS FILE?
//   Express's built-in Request type doesn't have a `user` property.
//   After our auth middleware verifies a JWT, we want to attach
//   the user info to `req.user`. TypeScript would normally error:
//     "Property 'user' does not exist on type 'Request'"
//
//   This file extends Express's Request interface to include `user`.
//
// TYPESCRIPT CONCEPT — Declaration Merging:
//   TypeScript lets you "re-open" an existing interface and add
//   properties to it. This is called "declaration merging".
//   By declaring `interface Request` inside the `Express` namespace,
//   we're merging our custom fields into Express's built-in Request.
//
// TYPESCRIPT CONCEPT — Optional Property (?):
//   `user?: JwtPayload` means `user` may or may not exist on req.
//   Before auth middleware runs, req.user is undefined.
//   After auth middleware runs, req.user has userId and role.
// ===================================================================

import { JwtPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      /** Set by auth middleware after JWT verification */
      user?: JwtPayload;
    }
  }
}
