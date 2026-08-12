import { z } from 'zod';
import { Platform } from '../domain/enums';
export const createCampaignSchema = z.object({
    instruction: z.string().min(1),
    platforms: z.array(z.nativeEnum(Platform)).min(1),
});
export const addMediaSchema = z.object({
    publicId: z.string(),
    secureUrl: z.string().url(),
    resourceType: z.string(),
    format: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    bytes: z.number().optional(),
});
