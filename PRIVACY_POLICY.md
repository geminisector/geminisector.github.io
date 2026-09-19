# CombatBot — Privacy Policy

**Effective date:** 2026
**Data controller ("we", "us"):** gemini sector - the person or community operating the
CombatBot instance you are using.
**Contact:** geminisector.github.io 
**Applies to:** the CombatBot Discord application (bot user, `!commands`, and slash
commands) and, where enabled, the Bridge Commander companion web activity served by the
same operator.

> CombatBot is an unofficial, non-commercial fan project for the Wing Commander
> "Gemini Sector" setting. It is not affiliated with, endorsed by, or sponsored by the
> owners of the Wing Commander trademarks. See the Terms of Service.

## 1. The short version

- We process the Discord information needed to run combat, campaigns, and character
  records for your server.
- We **do not** read or store ordinary chat. Only messages that begin with `!` (and
  slash-command invocations) are handled.
- We **do not** sell your data, run ads, or use it to train public machine-learning models.
- Game data lives on the operator's own server. Optional AI features either run
  locally or, if the operator configures an external provider, send the relevant text
  to that provider — see §5.
- You can ask the operator of your instance to access, correct, or delete your data
  (§8).

## 2. Who is responsible

CombatBot can be self-hosted by anyone. The **operator of the instance you use** is the
data controller for that instance and is responsible for its data, its retention, and
answering your requests. If you play on a community server, that community's staff are
the operators. This document describes what the software is capable of and the
baseline commitments we ask operators to honour.

## 3. What we process

### 3.1 Discord account and server identifiers
- Discord user ID, username / display name / nickname.
- Guild (server) ID and channel ID where a command is used.
- Role membership, used only to decide who may run Game-Master or admin commands.

### 3.2 Command inputs
- The text of a message **only when it begins with `!`**, plus slash-command names and
  options, so the command can be executed. Ordinary conversation is ignored.
- Attachments you deliberately send *with* a command (for example a mission file), read
  into memory so the command can use them.
- Any text you ask the bot to store, such as character backgrounds, roleplay notes, or
  mission notes.

### 3.3 Game and character data
Data you create while using the bot, which may include:
- characters: names, callsigns, skills, faction, experience, medals, inventory and
  equipment;
- player registry entries that associate your Discord name with your characters;
- combats, ship/status records, missions and campaign state, kill/score records, and a
  per-guild save directory (`resources/guilds/<guildId>/`).

### 3.4 Operational logs
- An in-Discord bot-log channel, which may record that a command was run, by whom, and
  its result.
- Optional technical trace files under `log/combat/` used for debugging combat
  resolution. These are disabled in normal test runs and can be disabled in production.
- A local task-progress web page (default `127.0.0.1:8765`) used by the operator to
  watch long jobs. It is not a player-facing service.

## 4. Why we process it (legal bases)

We process the data above to:
- **perform the service** you asked for (running combats, campaigns, and records);
- pursue our **legitimate interests** in operating, securing, and debugging the bot;
- comply with **legal obligations** where applicable.

Where your local law requires consent (for example for optional external AI features),
the operator must obtain it.

## 5. Third parties and external services

- **Discord** — the bot runs as a Discord application; Discord processes messages,
  interactions, and identifiers under Discord's own Privacy Policy. This is unavoidable.
- **Local AI (default, optional)** — NPC chat and text scoring can use a model running on
  the operator's own machine (Ollama at `http://localhost:11434`). In that case the text
  stays on that machine.
- **External AI (optional)** — if the operator configures an external provider (the
  software supports Google's Generative Language / Gemini API), the prompt text needed
  for the request — which may include recent chat or roleplay text being processed — is
  transmitted to that provider and handled under **its** terms and privacy policy.
  Operators who enable this should say so in their server rules. It is off unless an
  operator adds an API key.
- **Webhooks** — the operator may configure Discord webhooks to post bot output to
  channels. That stays within Discord.
- **No** advertising networks, data brokers, or analytics/tracking SDKs.
- **No sale** of personal data, and **no** use of your content to train models.

## 6. Where data is stored and for how long

- Data is stored on the operator's server in flat files and SQLite databases under the
  project directory, namespaced per guild.
- Secrets such as the bot token (`resources/channel.token`) and any AI API key
  (`resources/npc_ai.json`) must be kept out of source control and are not published.
- **Retention** is indefinite until deleted. The software performs no automatic expiry.
  Server owners and players can remove data:
  - `!combat delete <combat_number>` removes a combat and its stack;
  - characters, missions, and other records can be removed by the operator from the save
    files and databases, or through whichever management commands the operator's build
    offers;
  - operators can delete a guild's directory (`resources/guilds/<guildId>/`) to remove
    all of that server's state;
  - if there is no command for what you need removed, ask the operator and they can
    delete the record directly.
- Backups, if the operator keeps them, follow the same rules.

## 7. Security

We rely on Discord's authentication and role permissions to control who may run
privileged commands, and we ask operators to keep the host, save files, and tokens
protected, to restrict access to the save directory, and to enable logging-off where
trace files are not needed. No system can be guaranteed 100% secure; use the bot with
that in mind.

## 8. Your choices and rights

Depending on where you live, you may have rights to access, correct, delete, restrict, or
object to processing, and to data portability. To exercise them, contact the operator of
the instance you use at [CONTACT EMAIL] / [DISCORD SUPPORT SERVER INVITE]. Because
instances are self-hosted, the operator of your instance — not the software authors — is
the party who can act on your request. We aim to respond within 30 days.

## 9. Children

CombatBot is intended for people who are at least the minimum age for Discord in their
country (13 in most places, older in some). It is not directed to children, and we do
not knowingly process data from anyone below that age. If you believe a child has used
the bot, contact the operator to have the data removed.

## 10. International transfers

The operator's server may be in a different country from you, and Discord (and any
external AI provider, if enabled) may process data in other countries. By using the bot
you understand that your data may be handled outside your country of residence.

## 11. Changes

We may update this policy. Material changes will be announced in the support server and
the effective date above will change. Continued use after a change means you accept it.

## 12. Contact

Gemini Sector Team
Contact: https://github.com/geminisector/geminisector.github.io/issues/new
Discord: geminisector.github.io

---

_This document is a template provided with the project and is **not legal advice**.
Operators should review it against their own jurisdiction and obligations before
publishing._
