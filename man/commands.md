---
layout: default
title: Player Commands
---

# **Gemini Sector Command Reference**

This document outlines all available commands for the Gemini Sector, categorized by their function group (Combat, Database, System, Deck, and Melee).  
**Key for Examples:**

* **Combat Number**: Kurasawa\_2  
* **Pilot**: Maverick  
* **Gunner**: Maniac  
* **Crewman**: Angel  
* **Ship**: Scimitar

## **🚀 Combat Commands**

**Prefix**: \!combat or \!c

### **join**

* **Description**: Join a particular combat.  
* **Role**: Player  
* **Syntax**: \!combat join \<Combat \#\> \<Join Type \# 0|1|2|3\> \<Character\> \<Craft Name\>  
* **Join Types**:  
  * 0: Temporary/Standard Join  
  * 1: Permanent Craft  
  * 2: Craft Type  
  * 3: Join as Gunner  
  * 4: Join as Crewman  
* **Example (Pilot)**: \!combat join Kurasawa\_2 0 Maverick Scimitar  
* **Example (Gunner)**: \!combat join Kurasawa\_2 3 Maniac Scimitar  
* **Example (Crew)**: \!combat join Kurasawa\_2 4 Angel Scimitar

### **mission**

* **Description**: Generate a random mission name.  
* **Role**: Owner  
* **Syntax**: \!combat mission  
* **Example**: \!combat mission

### **leave**

* **Description**: Causes a character to leave a combat.  
* **Role**: Player  
* **Syntax**: \!combat leave \<Combat \#\> \<Pilot Name\> \<Leave Type \[0,1\]\>  
* **Leave Types**: 0 (Leave ship in combat), 1 (Remove ship and occupants)  
* **Example**: \!combat leave Kurasawa\_2 Maverick 1

### **merge**

* **Description**: Merges two combats. All ships from source are moved to destination.  
* **Role**: GM  
* **Syntax**: \!combat merge \<Source Combat \#\> \<Destination Combat \#\>  
* **Example**: \!combat merge Kurasawa\_2 Kurasawa\_3

### **transfer**

* **Description**: Transfer a pilot from one combat to another.  
* **Role**: Owner  
* **Syntax**: \!combat transfer \<Source Combat \#\> \<Character\> \<Destination Combat \#\>  
* **Example**: \!combat transfer Kurasawa\_2 Maverick Kurasawa\_3

### **remove**

* **Description**: Removes a ship and all occupants from a combat.  
* **Role**: Owner  
* **Syntax**: \!combat remove \<Combat \#\> \<Specific Craft Name\> \<Remove Type \[0,1\]\>  
* **Remove Types**: 0 (Save data), 1 (Purge data)  
* **Example**: \!combat remove Kurasawa\_2 Maverick 0

### **set**

* **Description**: Inhabit a character within a specific combat.  
* **Role**: Player  
* **Syntax**: \!combat set \<Combat \#\> \<Character Name\>  
* **Example**: \!combat set Kurasawa\_2 Maverick

### **action**

* **Description**: Set Combat Action.  
* **Role**: Player  
* **Syntax**: \!combat action \<Combat \#\> \<Character Name\> \<Action\> \<Target\>  
* **Actions**: Pass, Attack, Called=Front/Left/Right/Aft/Turret-Tag  
* **Example**: \!combat action Kurasawa\_2 Maverick Attack Kilrathi\_Dralthi

### **weapon**

* **Description**: Set Current Weapon.  
* **Role**: Player  
* **Syntax**: \!combat weapon \<Combat \#\> \<Character Name\> \<Weapon Tag\>  
* **Example**: \!combat weapon Kurasawa\_2 Maverick Laser\_Cannon

### **nav**

* **Description**: Set next nav point or view nav map.  
* **Role**: Owner  
* **Syntax**: \!combat nav \<Combat \#\> \<Nav Point Name\>  
* **Example**: \!combat nav Kurasawa\_2 Nav\_Point\_Alpha

### **stance**

* **Description**: Set Pilot's Stance.  
* **Role**: Player  
* **Syntax**: \!combat stance \<Combat \#\> \<Stance\> \<Character Name\>  
* **Stances**: Banzai, Aggressive, Normal, Cautious, Evasive  
* **Example**: \!combat stance Kurasawa\_2 Aggressive Maverick

### **damage**

* **Description**: Show Ship's Current Stats/Damage.  
* **Role**: Player  
* **Syntax**: \!combat damage \<Combat \#\> \<Pilot/Craft Name\> \<Show Type\>  
* **Show Types**: 0 (Private Table), 1 (Public Table), 2 (Private VDU), 3 (Public VDU)  
* **Example**: \!combat damage Kurasawa\_2 Maverick 1

### **show**

* **Description**: Show Ship's Current Stats (Alias for damage status).  
* **Role**: Player  
* **Syntax**: \!combat show \<Combat \#\> \<Pilot/Craft Name\> \<Public-1/Private-0\>  
* **Example**: \!combat show Kurasawa\_2 Maverick 1

### **hero**

* **Description**: Applies Heroic Luck to a Pilot.  
* **Role**: Player  
* **Syntax**: \!combat hero \<Combat \#\> \<Character Name\> \<Application\>  
* **Applications**: Offense, Defense, KO, None  
* **Example**: \!combat hero Kurasawa\_2 Maverick Offense

### **faction**

* **Description**: Sets a faction for the player.  
* **Role**: Owner  
* **Syntax**: \!combat faction \<Combat \#\> \<Character Name\> \<Faction Name\>  
* **Example**: \!combat faction Kurasawa\_2 Maverick Confederation

### **scan**

* **Description**: Scans a target.  
* **Role**: Player  
* **Syntax**: \!combat scan \<Combat \#\> \<Character Name\> \<Difficulty Check\>  
* **Example**: \!combat scan Kurasawa\_2 Maverick 15

### **taunt**

* **Description**: Taunt someone.  
* **Role**: Player  
* **Syntax**: \!combat taunt \<Combat \#\> \<Character Name\> \<DC or Target\>  
* **Example**: \!combat taunt Kurasawa\_2 Maverick Maniac

### **taunt\_dc**

* **Description**: Get the taunt difficulty.  
* **Role**: Observer  
* **Syntax**: \!combat taunt\_dc \<Combat \#\> \<Character Name\> \<DC\>  
* **Example**: \!combat taunt\_dc Kurasawa\_2 Maverick 15

### **get\_focus**

* **Description**: Get a focus hint on a character.  
* **Role**: Player  
* **Syntax**: \!combat get\_focus \<Combat \#\> \<Character Name\>  
* **Example**: \!combat get\_focus Kurasawa\_2 Maverick

### **cargo**

* **Description**: Adds Cargo to a ship.  
* **Role**: Owner  
* **Syntax**: \!combat cargo \<Combat \#\> \<Character Name\> \<Item\> \<Quantity\> \<Hidden\>  
* **Example**: \!combat cargo Kurasawa\_2 Maverick Missiles 10 0

### **viewluck**

* **Description**: View current available luck.  
* **Role**: Player  
* **Syntax**: \!combat viewluck \<Combat \#\> \<Character Name\>  
* **Example**: \!combat viewluck Kurasawa\_2 Maverick

### **sheet**

* **Description**: Show a Character's Attributes and Stats.  
* **Role**: Observer  
* **Syntax**: \!combat sheet \<Character\> \<Public-1/Private-0\>  
* **Example**: \!combat sheet Maverick 1

### **start**

* **Description**: Start a new combat.  
* **Role**: Owner  
* **Syntax**: \!combat start \<Combat \#\> \<Type 0-4\>  
* **Types**: 0 (Mock), 1 (Real), 2 (Autogenerated), 3 (Mock Mission), 4 (Real Mission)
* **Example**: \!combat start Kurasawa\_2 1

### **end**

* **Description**: Ends a combat.  
* **Role**: Owner  
* **Syntax**: \!combat end \<Combat \#\> \<(Opt) 1 to purge\>  
* **Example**: \!combat end Kurasawa\_2

### **branch**

* **Description**: Duplicates the current combat to a new number.  
* **Role**: Owner  
* **Syntax**: \!combat branch \<Combat Number\> \<New Combat Number\>  
* **Example**: \!combat branch Kurasawa\_2 Kurasawa\_2\_Sim

### **turn**

* **Description**: Turns the combat over, calculating results.  
* **Role**: Owner  
* **Syntax**: \!combat turn \<Combat Number\> \<(Opt) t for test\>  
* **Example**: \!combat turn Kurasawa\_2

### **autopilot**

* **Description**: Displays an autopilot cutscene.  
* **Role**: Owner  
* **Syntax**: \!combat autopilot \<Combat Number\>  
* **Example**: \!combat autopilot Kurasawa\_2

### **jump**

* **Description**: Displays a jump cutscene and removes person from fight.  
* **Role**: Player  
* **Syntax**: \!combat jump \<Combat Number\> \<Combatant\>  
* **Example**: \!combat jump Kurasawa\_2 Maverick

### **status**

* **Description**: Show Combat's Status of Combatants.  
* **Role**: Observer  
* **Syntax**: \!combat status \<Combat \#\> \<Status Type 0-4\>  
* **Example**: \!combat status Kurasawa\_2 1

### **ready**

* **Description**: Analyzes and outputs overview of issues in combat.  
* **Role**: Owner  
* **Syntax**: \!combat ready \<Combat Number\>  
* **Example**: \!combat ready Kurasawa\_2

### **comm**

* **Description**: Generate an NPC's message.  
* **Role**: Player  
* **Syntax**: \!combat comm \<Combat \#\> \<Sender Name\> \<Receiver Name\>  
* **Example**: \!combat comm Kurasawa\_2 Maverick Maniac

### **hack**

* **Description**: Attempt to hack into a computer system.  
* **Role**: Player  
* **Syntax**: \!combat hack \<Combat \#\> \<Action\> \<Sender\> \<Receiver\> \<Guess\>  
* **Example**: \!combat hack Kurasawa\_2 guess Maverick Computer password123

### **team**

* **Description**: Change character or characters' team.  
* **Role**: Owner  
* **Syntax**: \!combat team \<Combat \#\> \<Team Name\> \<Character List...\>  
* **Example**: \!combat team Kurasawa\_2 BlueSquadron Maverick Maniac

### **teamaction**

* **Description**: Set Team's Combat Action.  
* **Role**: Owner  
* **Syntax**: \!combat teamaction \<Combat \#\> \<Target Type\> \<Team Name\> \<Action\> \<Targets...\>  
* **Example**: \!combat teamaction Kurasawa\_2 1 BlueSquadron Attack Kilrathi\_Fighter

### **multishot**

* **Description**: Initiate Multi-Shot (for turrets).  
* **Role**: Player  
* **Syntax**: \!combat multishot \<Combat \#\> \<Character Name\> \<Targets...\>  
* **Example**: \!combat multishot Kurasawa\_2 Maniac Target1 Target2 Target3

### **touch**

* **Description**: Applies the Touch of GM to a Character.  
* **Role**: GM  
* **Syntax**: \!combat touch \<Combat \#\> \<Character Name\>  
* **Example**: \!combat touch Kurasawa\_2 Maverick

### **edit**

* **Description**: Edit a Character inside combat.  
* **Role**: GM  
* **Syntax**: \!combat edit \<Combat \#\> \<Character Name\> \<Element\> \<Value\>  
* **Example**: \!combat edit Kurasawa\_2 Maverick XP 50

### **repair**

* **Description**: Repair a ship or component.  
* **Role**: Owner  
* **Syntax**: \!combat repair \<Combat \#\> \<Name\> \<Component\> \<Percent\>  
* **Example**: \!combat repair Kurasawa\_2 Maverick Armor 100

### **give**

* **Description**: Give something to a combat character.  
* **Role**: GM  
* **Syntax**: \!combat give \<Combat \#\> \<Character Name\> \<Luck/Weapon\> \<Number\>  
* **Example**: \!combat give Kurasawa\_2 Maverick Luck 1

### **report**

* **Description**: Generate a CSV report.  
* **Role**: GM  
* **Syntax**: \!combat report \<Combat Number\>  
* **Example**: \!combat report Kurasawa\_2

### **save**

* **Description**: Pushes current combat to the stack.  
* **Role**: Owner  
* **Syntax**: \!combat save \<Combat \#\>  
* **Example**: \!combat save Kurasawa\_2

### **logname**

* **Description**: Sets the logout name.  
* **Role**: Owner  
* **Syntax**: \!combat logname \<Name\>  
* **Example**: \!combat logname Mission\_Log\_01

### **load**

* **Description**: Pulls the latest entry off the Combat Stack.  
* **Role**: Owner  
* **Syntax**: \!combat load \<Combat \#\> \<Prior Entry\> \<Reorder Stack\>  
* **Example**: \!combat load Kurasawa\_2

### **lock**

* **Description**: Locks a Combat's Stack.  
* **Role**: GM  
* **Syntax**: \!combat lock \<Combat \#\> \<0-Open|1-Lock\>  
* **Example**: \!combat lock Kurasawa\_2 1

### **delete**

* **Description**: Deletes the Combat and its Stack.  
* **Role**: GM  
* **Syntax**: \!combat delete \<Combat \#\> \<(Opt) 1-Purge\>  
* **Example**: \!combat delete Kurasawa\_2

## **💾 Database Commands**

**Prefix**: \!database

### **list**

* **Description**: List database items.  
* **Role**: Observer  
* **Syntax**: \!database list \<Category\>  
* **Categories**: combats, characters, ships, types, weapons, cargo  
* **Example**: \!database list characters

### **view**

* **Description**: View an item within the database.  
* **Role**: Observer  
* **Syntax**: \!database view \<Category\> \<Item\>  
* **Example**: \!database view characters Maverick

### **new**

* **Description**: Create a new item.  
* **Role**: GM  
* **Syntax**: \!database new \<Category\> \<Name\>  
* **Example**: \!database new characters Maverick

### **note**

* **Description**: Take down a note.  
* **Role**: GM  
* **Syntax**: \!database note \<Mission\> \<Topic\> \<Note\>  
* **Example**: \!database note Kurasawa\_2 tactics "Attack the rear"

### **edititem**

* **Description**: Edit an item attribute.  
* **Role**: GM  
* **Syntax**: \!database edititem \<Category\> \<Name\> \<Attribute\> \<Value\>  
* **Example**: \!database edititem characters Maverick XP 200

### **deleteitem**

* **Description**: Delete an item from the database.  
* **Role**: GM  
* **Syntax**: \!database deleteitem \<Category\> \<Name\>  
* **Example**: \!database deleteitem characters Maverick

### **seekitem**

* **Description**: Find where an item is referenced.  
* **Role**: GM  
* **Syntax**: \!database seekitem \<Category\> \<Name\>  
* **Example**: \!database seekitem characters Maverick

### **skill**

* **Description**: Make a skill attempt or opposed roll.  
* **Role**: Player  
* **Syntax**: \!database skill \<Character\> \<Skill\> \<Attribute\> \<DC or Opponent\>  
* **Example**: \!database skill Maverick Piloting Agility 20

### **sheet**

* **Description**: Show Character Sheet.  
* **Role**: Observer  
* **Syntax**: \!database sheet \<Character\> \<Public-1/Private-0\>  
* **Example**: \!database sheet Maverick 1

### **chargen**

* **Description**: Generate a new character (80 XP).  
* **Role**: Player  
* **Syntax**: \!database chargen \<Callsign\> \<FirstName\> \<LastName\> \<Occupation\>  
* **Occupations**: p (pilot), g (gunner), no (naval officer), etc.  
* **Example**: \!database chargen Maverick Pete Mitchell p

### **edit**

* **Description**: Edit a Character.  
* **Role**: GM  
* **Syntax**: \!database edit \<Character\> \<Element\> \<Value\>  
* **Example**: \!database edit Maverick XP 100

### **name**

* **Description**: Change a Character's name.  
* **Role**: Player  
* **Syntax**: \!database name \<Character\> \<Position c/f/l/o\> \<Name\>  
* **Example**: \!database name Maverick c IceMan

### **occ**

* **Description**: Change a Character's occupation.  
* **Role**: GM  
* **Syntax**: \!database occ \<Character\> \<Occupation Tag\>  
* **Example**: \!database occ Maverick g

### **look**

* **Description**: Show Character Description.  
* **Role**: Observer  
* **Syntax**: \!database look \<Character\> \<Public-1/Private-0\>  
* **Example**: \!database look Maverick 1

### **desc**

* **Description**: Enter a new description tag.  
* **Role**: Player  
* **Syntax**: \!database desc \<Character\> \<Tag\> \<Description\>  
* **Example**: \!database desc Maverick Uniform "Standard Flight Suit"

### **listdesc**

* **Description**: List all description tags.  
* **Role**: Observer  
* **Syntax**: \!database listdesc \<Character\>  
* **Example**: \!database listdesc Maverick

### **removedesc**

* **Description**: Remove a description tag.  
* **Role**: Player  
* **Syntax**: \!database removedesc \<Character\> \<Tag\>  
* **Example**: \!database removedesc Maverick Uniform

### **setdesc**

* **Description**: Set the primary description seen by others.  
* **Role**: Player  
* **Syntax**: \!database setdesc \<Character\> \<Tag\>  
* **Example**: \!database setdesc Maverick Uniform

### **addquirk**

* **Description**: Add a quirk to a character.  
* **Role**: Player  
* **Syntax**: \!database addquirk \<Character\> \<Quirk\>  
* **Example**: \!database addquirk Maverick "Need for Speed"

### **removequirk**

* **Description**: Remove a quirk by index.  
* **Role**: Player  
* **Syntax**: \!database removequirk \<Character\> \<Index\>  
* **Example**: \!database removequirk Maverick 0

### **achievement**

* **Description**: Display an achievement popup.  
* **Role**: GM  
* **Syntax**: \!database achievement \\\<Character\>\\\<Title\>\\\<Description\>\\\<Color\>  
* **Example**: \!database achievement \\Maverick\\Ace\\5 Kills\\Gold

### **achievements**

* **Description**: Show a character's achievements.  
* **Role**: Observer  
* **Syntax**: \!database achievements \<Character\>  
* **Example**: \!database achievements Maverick

### **kills**

* **Description**: Show a character's kills.  
* **Role**: Observer  
* **Syntax**: \!database kills \<Character\>  
* **Example**: \!database kills Maverick

### **killboard**

* **Description**: Show total killboard.  
* **Role**: Observer  
* **Syntax**: \!database killboard  
* **Example**: \!database killboard

### **export / import**

* **Description**: Export/Import database lists to text.  
* **Role**: GM  
* **Syntax**: \!database export \<item\> \<file\>  
* **Example**: \!database export c characters.txt

### **date**

* **Description**: Show or modify current date/time.  
* **Role**: GM  
* **Syntax**: \!database date \<add hours\> \<add minutes\>  
* **Example**: \!database date 24 0

## **🖥️ System Commands**

**Prefix**: \!system

### **help**

* **Description**: Get help on command groups.  
* **Role**: Observer  
* **Syntax**: \!system help \<Set Name\>  
* **Example**: \!system help COMBAT

### **quit**

* **Description**: Disconnects Combat Bot.  
* **Role**: GM  
* **Syntax**: \!system quit \<Backup? 0|1\> \<DB Name\>  
* **Example**: \!system quit 1 Master

### **backup**

* **Description**: Backup the entire database.  
* **Role**: GM  
* **Syntax**: \!system backup \<DB Name\>  
* **Example**: \!system backup MasterBackup

### **loaddat**

* **Description**: Load a database.  
* **Role**: GM  
* **Syntax**: \!system loaddat \<DB Name\>  
* **Example**: \!system loaddat MasterBackup

### **test**

* **Description**: Run a test case file.  
* **Role**: GM  
* **Syntax**: \!system test \<File\>  
* **Example**: \!system test test\_scenario.txt

### **roll**

* **Description**: Roll a random number (1-9999).  
* **Role**: Observer  
* **Syntax**: \!system roll \<Number\>  
* **Example**: \!system roll 100

### **jam, jam25, jam50, jam75**

* **Description**: Jam a message (obfuscate parts of it).  
* **Role**: Player  
* **Syntax**: \!system jam \<message\>  
* **Example**: \!system jam "This is a \<\<secret\>\> message"

### **runic / unrunic**

* **Description**: Convert message to/from Runic.  
* **Role**: Player  
* **Syntax**: \!system runic \<message\>  
* **Example**: \!system runic "Attack at dawn"

### **genace**

* **Description**: Generate a Kilrathi name.  
* **Role**: GM  
* **Syntax**: \!system genace  
* **Example**: \!system genace

### **generate\_mission\_name**

* **Description**: Generate a mission name.  
* **Role**: GM  
* **Syntax**: \!system generate\_mission\_name  
* **Example**: \!system generate\_mission\_name

### **logger**

* **Description**: Retrieve logs between dates.  
* **Role**: GM  
* **Syntax**: \!system logger \<Date1\> \<Date2\>  
* **Example**: \!system logger 01-01-2023 01-31-2023

## **🃏 Deck Commands**

**Prefix**: \!deck

### **new**

* **Description**: Create a new deck.  
* **Role**: Owner  
* **Syntax**: \!deck new  
* **Example**: \!deck new

### **draw**

* **Description**: Draw cards.  
* **Role**: Player  
* **Syntax**: \!deck draw \<Number\>  
* **Example**: \!deck draw 2

### **show**

* **Description**: Show your hand.  
* **Role**: Player  
* **Syntax**: \!deck show  
* **Example**: \!deck show

### **review**

* **Description**: Check your hand privately.  
* **Role**: Player  
* **Syntax**: \!deck review  
* **Example**: \!deck review

### **discard**

* **Description**: Discard a specific card position.  
* **Role**: Player  
* **Syntax**: \!deck discard \<position\>  
* **Example**: \!deck discard 1

## **⚔️ Melee Commands**

**Prefix**: \!melee

### **start**

* **Description**: Start a melee.  
* **Role**: Owner  
* **Syntax**: \!melee start \<fighter1\> \<fighter2\> \<ai?\>  
* **Example**: \!melee start Maverick Maniac

### **go**

* **Description**: Start the combat round.  
* **Role**: Owner  
* **Syntax**: \!melee go  
* **Example**: \!melee go

### **set**

* **Description**: Set move for the next round.  
* **Role**: Player  
* **Syntax**: \!melee set \<Strike|Grapple|Counter\> \<Fighter\>  
* **Example**: \!melee set Strike Maverick

### **end**

* **Description**: End the melee.  
* **Role**: Owner  
* **Syntax**: \!melee end  
* **Example**: \!melee end
