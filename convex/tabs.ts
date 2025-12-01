import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to get authenticated user
async function getUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export const saveTabs = mutation({
  args: {
    tabs: v.array(
      v.object({
        url: v.string(),
        favicon: v.optional(v.string()),
        title: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    const savedTabId = await ctx.db.insert("savedTabs", {
      userId: user._id,
      tabs: args.tabs,
      createdAt: Date.now(),
    });

    return savedTabId;
  },
});

export const getSavedTabs = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return [];
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

    if (!user) {
        return [];
    }

    const tabs = await ctx.db
      .query("savedTabs")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return tabs;
  },
});

export const deleteSavedTabs = mutation({
  args: {
    id: v.id("savedTabs"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    
    const existing = await ctx.db.get(args.id);
    if (!existing) {
        throw new Error("Tabs not found");
    }

    if (existing.userId !== user._id) {
        throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

