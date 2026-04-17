import { ImageResponse } from "next/og"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const contentType = "image/png"
export const size = { width: 1200, height: 630 }
export const alt = "Sonic Soul — Empatify"

export default async function OgImage({
  params,
}: {
  params: { locale: string; handle: string }
}) {
  const decoded = decodeURIComponent(params.handle)

  const row = await db
    .select({
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalGamesPlayed: users.totalGamesPlayed,
      averageRatingReceived: users.averageRatingReceived,
      topSongs: users.topSongs,
    })
    .from(users)
    .where(eq(users.name, decoded))
    .limit(1)

  const user = row[0]
  const name = user?.name ?? decoded
  const avatar = user?.avatarUrl ?? null
  const empathy = user?.averageRatingReceived ?? "0.0"
  const games = user?.totalGamesPlayed ?? 0
  const songs = (user?.topSongs ?? []).slice(0, 3)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #0A0A0A 0%, #1A0E05 55%, #3A1A00 100%)",
          color: "white",
          padding: 56,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* orange blob top-right */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(255,107,0,0.35)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />
        {/* orange blob bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -180,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(255,107,0,0.22)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />

        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: -0.5,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9999,
              background: "#FF6B00",
              display: "flex",
            }}
          />
          empatify
        </div>

        {/* body */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
            marginTop: 56,
          }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              width={220}
              height={220}
              alt=""
              style={{
                borderRadius: 9999,
                border: "4px solid white",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: 9999,
                border: "4px solid white",
                background: "#222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 96,
                fontWeight: 900,
                color: "#666",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                color: "#FF6B00",
                fontWeight: 900,
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontStyle: "italic",
                marginBottom: 12,
              }}
            >
              Sonic Soul
            </div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 84,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: "flex",
                gap: 40,
                marginTop: 28,
                color: "white",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    color: "#999",
                    fontSize: 16,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    fontWeight: 900,
                  }}
                >
                  Empathy
                </span>
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 900,
                    fontStyle: "italic",
                  }}
                >
                  {empathy}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    color: "#999",
                    fontSize: 16,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    fontWeight: 900,
                  }}
                >
                  Games
                </span>
                <span style={{ fontSize: 56, fontWeight: 900 }}>{games}</span>
              </div>
            </div>
          </div>
        </div>

        {/* top songs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: 10,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 24,
            padding: 24,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span
            style={{
              color: "#999",
              fontSize: 14,
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 900,
              marginBottom: 4,
            }}
          >
            Top Songs
          </span>
          {songs.length > 0 ? (
            songs.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    color: "#FF6B00",
                    fontStyle: "italic",
                    fontWeight: 900,
                  }}
                >
                  #{i + 1}
                </span>
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 920,
                  }}
                >
                  {s}
                </span>
              </div>
            ))
          ) : (
            <span
              style={{
                color: "#888",
                fontStyle: "italic",
                fontSize: 22,
              }}
            >
              Play more games to reveal the sonic fingerprint…
            </span>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
