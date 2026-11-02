# DEAD AIR — 城市静默 (V0.2 — Chapter One: Narrative Integrity & Consequence System)

**DEAD AIR — 城市静默** is a single-player, narrative-driven psychological thriller and open-world hacker RPG set in 2028 Greyhaven. Players step into the shoes of former corporate systems engineer **Eli Ward (`e.ward_09`)**, investigating tampered server logs on a diegetic Linux workstation (`GreyOS 6.4`), correlating chronological forensic timelines, navigating underground street contacts, and uncovering Vespera Data Solutions' covert **Project LANTERN** conspiracy.

---

## 1. Installation & Running the Game

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Run TypeScript typecheck / lint
npm run lint

# Run production build
npm run build

# Run the automated 17-point Node.js test suite
npm test
```

---

## 2. Core Gameplay & Chapter 1 Flow (`THE GHOST IN THE MACHINE`)

### Scene 01 — Apartment Night (`02:17 AM · Apartment 4B`)
1. **Smartphone Decision (`[P]`)**: Listen to former colleague **Nadia Park**'s cut-off voicemail and read the anonymous warning SMS (`"Don't call her. You're being watched."`). Confirm your **one-time** initial response (`CALL_NADIA`, `TRACE_SMS`, `WAIT_CHECK_PC`, or `CONTACT_ALLY`).
2. **Workstation Forensics (`[C]`)**: Open your GreyOS 6.4 Linux desktop and inspect at least **2** forensic files inside `/home/eli/Downloads/incident_0427` via the File Manager or Forensic Terminal (`cat ntp_override.conf`, `cat access_0427.log`, `cat auth_shadow.dump`, `cat lantern_schema_brief.txt`).
3. **Timeline Correlation (`[J]` or `verify`)**: Correlate the discovered artifacts chronologically to reconstruct the 14-minute Vespera blackout window.
4. **Exit Gate**: Only after completing all three steps above does the Apartment 4B exit unlock for **4th Avenue**.

### Scene 02 — 4th Avenue (`02:41 AM`)
- Inspect **Municipal Optical Pole #04** (if your `player_exposure >= 20%`, Vespera's street camera cross-matches your gait and increases `corporate_suspicion` by `+5%`).
- Optional Branch: Speak with investigative journalist **Rhea Solis** (*The Greyhaven Ledger*). Choosing to share your LANTERN logs establishes an encrypted media dead-drop (`rhea_allied = true`), a key requirement for **Ending A**.
- Enter the **24-Hour Coin Laundry**.

### Scene 03 — 24-Hour Coin Laundry (`02:48 AM`)
- Converse with **Nadia Park** across three sequential dialogue stages (`nadia_node_1` → `nadia_node_2` → `nadia_node_3`).
- Your choices shift `trust_nadia` and `corporate_suspicion`. If `trust_nadia >= 65%` upon completion, Nadia shares Vespera's Enclave fiber-tap filter (`-5% Player Exposure`).
- Completing all three stages grants the hardware decryption key **`moth_archive.key`** (`item_moth_usb`) and unlocks **Apartment Return (`03:12 AM`)**.

### Scene 04 — Apartment Return & Climax (`03:12 AM`)
- Return to Apartment 4B to find your workstation monitor unexpectedly awake and a new encrypted message from **MOTH** waiting on your smartphone (`[P]`).
- Open the Workstation (`[C]`) and inspect `/home/eli/archive_vault/lantern_auth_audit.db` (unlocked via `moth_archive.key`) to uncover `EV-06`: your own revoked employee ID (`e.ward_09`) was re-activated 48 hours ago to sign off on the log purge.
- The display is hijacked with **`"WE KNOW WHO YOU ARE."`**, transitioning into one of **three dynamic Chapter 1 Endings**.

---

## 3. Three Dynamic Chapter 1 Endings

| Ending | Code & Title | Trigger Conditions | Narrative Outcome |
| :--- | :--- | :--- | :--- |
| **Ending A** | **THE SIGNAL LEAKS / 信号破壁** | `evidence_count >= 5`, `timeline_correlated == true`, `journalist_contact == true` (`rhea_allied`), `trust_nadia >= 55%`, `corporate_suspicion < 45%`, `player_exposure < 45%` | Your automated dead-man switch transmits the correlated LANTERN dump to Rhea Solis before Vespera cuts your fiber. Morning headlines ignite a citywide crisis. |
| **Ending B** | **A DIRTY BARGAIN / 暗影交易** | `evidence_count >= 4`, `timeline_correlated == true`, `corporate_suspicion < 45%`, `player_exposure < 45%`, but lacking either `rhea_allied` or `trust_nadia >= 55%` | You hold the decrypted truth, but without a trusted media channel or ally network, you are forced to accept MOTH's extraction bargain. |
| **Ending C** | **THE FALL GUY / 替罪之羊** | `corporate_suspicion >= 45%` OR `player_exposure >= 45%` OR `evidence_count < 4` OR `!timeline_correlated` | High exposure/suspicion or incomplete forensics allows Director Marcus Hale's containment unit to frame `e.ward_09` on morning news. |

---

## 4. Virtual Linux Shell (`GreyOS 6.4`) Commands

Supported in-game forensic terminal commands:
- `help` — List available forensic shell commands
- `ls [dir]` — List directory contents and verification/lock status
- `cd <dir>` — Change directory (`/home/eli`, `/home/eli/Downloads/incident_0427`, `/home/eli/Documents`, `/home/eli/archive_vault`)
- `cat <file>` — Inspect file contents and log forensic evidence (`Permission denied` if locked)
- `stat <file>` — Display inode metadata, modification timestamps, and forensic link
- `grep <pattern> <file>` — Filter lines matching `<pattern>` and log evidence
- `unzip incident_0427.zip` — Verify and mount the leaked incident archive
- `verify` / `timeline` — Correlate discovered evidence chronologically (requires `>= 2` artifacts)
- `status` — Display Eli Ward exposure, suspicion, and Chapter 1 gate status
- `whoami` — Display current operator identity
- `clear` — Clear terminal output

---

## 5. Documentation Deliverables

- [Chapter 1 Flow & State Machine Guide (`CHAPTER_ONE_FLOW.md`)](./CHAPTER_ONE_FLOW.md)
- [V0.2 Technical Report (`TECHNICAL_REPORT_V02.md`)](./TECHNICAL_REPORT_V02.md)
