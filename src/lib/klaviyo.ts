/**
 * src/lib/klaviyo.ts
 *
 * Fire-and-forget Klaviyo contact sync. Never throws — email delivery must not block.
 * Wire up KLAVIYO_API_KEY and KLAVIYO_LIST_ID post-launch.
 */

const KLAVIYO_BASE     = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-02-15";

interface KlaviyoSyncInput {
  email: string;
  city: string;
}

export async function syncToKlaviyo(input: KlaviyoSyncInput): Promise<void> {
  const apiKey = process.env.KLAVIYO_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    console.warn("[klaviyo] KLAVIYO_API_KEY or KLAVIYO_LIST_ID not set — skipping sync");
    return;
  }

  const headers = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    "Content-Type": "application/json",
    revision: KLAVIYO_REVISION,
    Accept: "application/json",
  };

  let profileId: string | null = null;
  try {
    const profileRes = await fetch(`${KLAVIYO_BASE}/profiles/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email: input.email,
            properties: {
              city: input.city,
              source: "ballparkmywedding",
            },
          },
        },
      }),
    });

    if (profileRes.status === 409) {
      const errBody = await profileRes.json().catch(() => null);
      const dupId = errBody?.errors?.[0]?.meta?.duplicate_profile_id ?? null;
      if (dupId) {
        profileId = dupId;
        await fetch(`${KLAVIYO_BASE}/profiles/${dupId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            data: {
              type: "profile",
              id: dupId,
              attributes: {
                properties: { city: input.city, source: "ballparkmywedding" },
              },
            },
          }),
        });
      }
    } else if (profileRes.ok || profileRes.status === 201) {
      const body = await profileRes.json().catch(() => null);
      profileId = body?.data?.id ?? null;
    } else {
      const errText = await profileRes.text().catch(() => "");
      console.error(`[klaviyo] Profile upsert failed (${profileRes.status}):`, errText);
      return;
    }
  } catch (err) {
    console.error("[klaviyo] Profile upsert threw:", err);
    return;
  }

  if (!profileId) {
    console.error("[klaviyo] Could not determine profile ID — skipping list add");
    return;
  }

  try {
    const listRes = await fetch(
      `${KLAVIYO_BASE}/lists/${listId}/relationships/profiles/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ data: [{ type: "profile", id: profileId }] }),
      },
    );
    if (!listRes.ok && listRes.status !== 204) {
      const errText = await listRes.text().catch(() => "");
      console.error(`[klaviyo] List subscribe failed (${listRes.status}):`, errText);
    }
  } catch (err) {
    console.error("[klaviyo] List subscribe threw:", err);
  }
}
