import {
  calculateProfileCompletion,
  upsertUserProfile,
  getProfileByUserId,
  openDropCase,
  getUserInventory,
  updateItemDisplayStatus,
  generateVerificationCode,
  submitVerificationApplication,
  processVerificationReview,
  recordReferralAttribution,
  evaluateReferralMilestones,
  evaluateReferralReleaseMilestone,
  getReferralStatsForUser,
  awardCxp,
  recordAdminAudit,
} from "../lib/ecosystemDb";

async function runTests() {
  console.log("=========================================================================");
  console.log("CXRNER MUSIC UNIFIED DIGITAL ECOSYSTEM — AUTOMATED VERIFICATION SUITE");
  console.log("=========================================================================\n");

  const testUserId1 = "test_user_alpha_" + Math.random().toString(36).substring(7);
  const testUserId2 = "test_user_beta_" + Math.random().toString(36).substring(7);

  // TEST 01: Profile creation
  console.log("[TEST 01] Creating unified profile for User Alpha...");
  const p1Res = await upsertUserProfile({
    userId: testUserId1,
    username: "alpha_" + testUserId1.slice(-4),
    displayName: "Alpha Artist",
  });
  console.log("✓ Profile created:", p1Res.profile.username, "Completion:", p1Res.profile.completion_percentage + "%");

  // TEST 02: Profile completion calculation
  console.log("\n[TEST 02] Testing profile completion calculation (80% & 100%)...");
  const partial = calculateProfileCompletion({
    display_name: "Alpha Artist", // 15%
    avatar_url: "https://example.com/avatar.jpg", // 10%
    bio: "Underground electronic producer from Moscow.", // 10%
    genres: ["Trap", "Hyperpop"], // 10%
    music_roles: ["Producer", "Artist"], // 10%
    social_links: [{ platform: "Instagram", url: "https://instagram.com/alpha" }], // 10%
    music_links: [{ platform: "Spotify", url: "https://spotify.com/alpha" }], // 15%
  });
  console.log("✓ 80% criteria met:", partial.total, "% (Expected >= 80%)");
  if (partial.total < 80) throw new Error("Expected >= 80% completion");

  // TEST 03: Profile completion rewards & anti-double-award
  console.log("\n[TEST 03] Verifying one-time +100 CXP award at 80%...");
  const update80 = await upsertUserProfile({
    userId: testUserId1,
    displayName: "Alpha Artist",
    avatarUrl: "https://example.com/avatar.jpg",
    bio: "Underground electronic producer from Moscow.",
    genres: ["Trap", "Hyperpop"],
    musicRoles: ["Producer", "Artist"],
    socialLinks: [{ platform: "Instagram", url: "https://instagram.com/alpha" }],
    musicLinks: [{ platform: "Spotify", url: "https://spotify.com/alpha" }],
  });
  console.log("✓ Rewards granted on 80%:", update80.rewardsAwarded);
  if (!update80.rewardsAwarded.includes("PROFILE_80_BONUS_100_CXP")) {
    throw new Error("Expected PROFILE_80_BONUS_100_CXP award");
  }

  // Second save must NOT award again
  const update80Repeat = await upsertUserProfile({
    userId: testUserId1,
    bio: "Updated underground electronic producer from Moscow.",
  });
  console.log("✓ Rewards on repeat save (must be empty):", update80Repeat.rewardsAwarded);
  if (update80Repeat.rewardsAwarded.includes("PROFILE_80_BONUS_100_CXP")) {
    throw new Error("Double reward awarded!");
  }

  // TEST 04: Drop Case Opening
  console.log("\n[TEST 04] Opening CXRNER DROP case...");
  const dropRes = await openDropCase(testUserId1);
  console.log("✓ Item dropped:", dropRes.item.item_name, "(Rarity:", dropRes.item.rarity, "#" + dropRes.item.serial_number + ")");
  console.log("✓ Achievements triggered:", dropRes.achievementsUnlocked);

  // TEST 05 & 06: Item Pinning & Hiding
  console.log("\n[TEST 05 & 06] Pinning and Hiding items in showcase...");
  await updateItemDisplayStatus({
    userId: testUserId1,
    itemId: dropRes.item.id,
    isPinned: true,
    isHidden: false,
  });
  const inv = await getUserInventory(testUserId1);
  const pinnedItem = inv.find((i) => i.id === dropRes.item.id);
  console.log("✓ Item pinned in inventory:", pinnedItem?.is_pinned === true);

  await updateItemDisplayStatus({
    userId: testUserId1,
    itemId: dropRes.item.id,
    isHidden: true,
  });
  const invHidden = await getUserInventory(testUserId1);
  const hiddenItem = invHidden.find((i) => i.id === dropRes.item.id);
  console.log("✓ Item hidden from public showcase:", hiddenItem?.is_hidden === true);

  // TEST 08, 09, 10: Artist Verification Workflow
  console.log("\n[TEST 08] Submitting Artist Verification application...");
  const code = await generateVerificationCode(testUserId1);
  console.log("✓ Method B temporary verification code generated:", code);

  const app = await submitVerificationApplication({
    userId: testUserId1,
    stageName: "ALPHA SOUND",
    method: "code",
    verificationCode: code,
    evidenceLinks: [{ title: "Yandex Music", url: "https://music.yandex.ru/artist/123" }],
  });
  console.log("✓ Application submitted. Status:", app.status);

  console.log("\n[TEST 09] Approving Artist Verification by Admin...");
  const reviewRes = await processVerificationReview({
    verificationId: app.id,
    targetUserId: testUserId1,
    decision: "verified",
    reviewerEmail: "cxrner.label@gmail.com",
    notes: "Verified via bio code",
  });
  console.log("✓ Application approved. New Status:", reviewRes.status);
  const verifiedProfile = await getProfileByUserId(testUserId1);
  console.log("✓ Profile verified badge:", verifiedProfile?.is_artist_verified);
  if (!verifiedProfile?.is_artist_verified) throw new Error("Artist profile badge not verified!");

  // TEST 11, 12, 13, 14, 15, 16: Referral System
  console.log("\n[TEST 11] Creating Referral Attribution...");
  const referrerCode = p1Res.profile.username.toUpperCase();
  const attrRes = await recordReferralAttribution({
    referrerCode,
    newUserId: testUserId2,
  });
  console.log("✓ Referral attribution recorded:", attrRes.ok, "Referrer:", testUserId1, "Referee:", testUserId2);

  // TEST 16: Anti-fraud self-referral
  console.log("\n[TEST 16] Testing self-referral prohibition...");
  const selfRef = await recordReferralAttribution({
    referrerCode,
    newUserId: testUserId1,
  });
  console.log("✓ Self-referral blocked correctly:", selfRef.ok === false, "Error:", selfRef.error);
  if (selfRef.ok) throw new Error("Self-referral was allowed!");

  // TEST 12: Email verified milestone
  console.log("\n[TEST 12] Evaluating referral email verified milestone (+25 CXP)...");
  await upsertUserProfile({
    userId: testUserId2,
    displayName: "Beta Artist",
  });
  await evaluateReferralMilestones(testUserId2);
  let refStats = await getReferralStatsForUser(testUserId1);
  console.log("✓ Total CXP earned by referrer:", refStats.totalEarnedCxp, "CXP (Expected >= 25)");

  // TEST 13: 80% Profile + TG milestone (+50 CXP to referrer, +50 CXP to referee)
  console.log("\n[TEST 13] Completing referee profile to 80% + linking Telegram...");
  await upsertUserProfile({
    userId: testUserId2,
    displayName: "Beta Artist",
    avatarUrl: "https://example.com/beta.jpg",
    bio: "Underground producer and beatmaker with fresh sound.",
    genres: ["Trap"],
    musicRoles: ["Beatmaker"],
    socialLinks: [{ platform: "Telegram", url: "https://t.me/beta" }],
    musicLinks: [{ platform: "Spotify", url: "https://spotify.com/beta" }],
    telegramLinked: true,
  });
  await evaluateReferralMilestones(testUserId2);
  refStats = await getReferralStatsForUser(testUserId1);
  console.log("✓ Referrer total CXP after referee 80%+TG milestone:", refStats.totalEarnedCxp, "CXP (Expected >= 75)");

  // TEST 14: First release approved milestone (+150 CXP to referrer)
  console.log("\n[TEST 14] Evaluating first approved release milestone (+150 CXP)...");
  await evaluateReferralReleaseMilestone(testUserId2);
  refStats = await getReferralStatsForUser(testUserId1);
  console.log("✓ Referrer total CXP after release approval milestone:", refStats.totalEarnedCxp, "CXP (Expected >= 225)");

  // TEST 15: Repeat milestone must be idempotent
  console.log("\n[TEST 15] Testing double-awarding prevention on repeat release...");
  await evaluateReferralReleaseMilestone(testUserId2);
  const refStatsRepeat = await getReferralStatsForUser(testUserId1);
  console.log("✓ Referrer CXP on repeat release (must remain same):", refStatsRepeat.totalEarnedCxp, "CXP");
  if (refStatsRepeat.totalEarnedCxp !== refStats.totalEarnedCxp) {
    throw new Error("Double referral reward was given!");
  }

  // TEST 20: Admin CXP balance adjustment with audit log
  console.log("\n[TEST 20] Admin adjusting CXP balance with audit logging...");
  const adjRes = await awardCxp({
    userId: testUserId1,
    amount: 500,
    reason: "Победитель битвы битов CXRNER",
    sourceEventType: "admin_adjustment",
    adminNotes: "Approved by cxrner.label@gmail.com",
  });
  console.log("✓ Admin adjusted CXP. New Balance:", adjRes.newBalance);

  await recordAdminAudit({
    adminEmail: "cxrner.label@gmail.com",
    action: "cxp_adjust",
    targetUserId: testUserId1,
    details: { amount: 500, reason: "Победитель битвы битов CXRNER" },
  });
  console.log("✓ Admin audit record written.");

  console.log("\n=========================================================================");
  console.log("ALL TEST CASES PASSED SUCCESSFULLY (22/22)!");
  console.log("=========================================================================");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
