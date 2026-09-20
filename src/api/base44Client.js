/**
 * Compatibility shim.
 *
 * The app imports `base44` from here in ~38 places. Rather than touch all of
 * them, this module now re-exports the Worker-backed client, so those call
 * sites keep working unchanged while the SDK underneath is gone.
 *
 * New code should import from '@/api/client' directly; this file exists so the
 * migration is a data-layer swap rather than a 38-file rewrite.
 */

export { base44, ApiError } from './client';
export { default } from './client';
