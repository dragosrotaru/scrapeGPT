const z = require("zod");

module.exports.default = z.object({
    type: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    bedrooms: z.string(),
    maxPrice: z.string(),
    minPrice: z.string(),
});
