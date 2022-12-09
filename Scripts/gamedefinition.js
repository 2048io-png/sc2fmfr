﻿var game =
{
    scrap: 0,
    scrapThisPrestige: new Decimal(0),
    mergesThisPrestige: 0,
    highestScrapReached: new Decimal(0),
    highestBarrelReached: 0,
    highestMasteryLevel: 0,
    magnets: new Decimal(0),
    remainderMagnets: 0,
    dimension: 0,
    glitchesCollected: 0,

    totalMerges: 0,
    selfMerges: 0,

    ms: [],
    code: undefined,

    goldenScrap:
    {
        amount: new Decimal(0),
        upgrades:
        {
            scrapBoost: new GoldenScrapUpgrade(
                level => {
                    let m = [500, 1000, 1500, 2000, 3000, 4500, 6000, 8000, 30e3, 100e3, 1e6, 10e6, 1e9];
                    return new Decimal(m[Math.min(level, m.length - 1)]).mul(Decimal.pow(10, Math.max(0, level - m.length + 1)))
                        .mul(Decimal.pow(2, Math.max(0, level - m.length - 1 + 1)))
                        .mul(Decimal.pow(2, Math.pow(Math.max(0, level - 17), 1.3)))
                        .mul(Decimal.pow(3, Math.pow(Math.max(0, level - 21), 1.3)));
                },
                level => {
                    let m = [1, 2, 5, 15, 40, 100, 300, 800, 2500, 10e3, 30e3, 75e3, 200e3, 1e6];
                    return new Decimal(m[Math.min(level, m.length - 1)]).mul(Decimal.pow(10, Math.max(0, level - m.length + 1)));
                },
                {
                    maxLevel: 100,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0)
                }),
            magnetBoost: new GoldenScrapUpgrade(
                level => Decimal.pow(1.1, level).mul(200).add(50 * level),
                level => new Decimal(1 + 0.1 * level).mul(Decimal.pow(1.02, Math.max(0, level - 40))),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x", "", { namesAfter: 1e9 })
                }),
            gsBoost: new GoldenScrapUpgrade(
                level => Decimal.pow(1.8, level).mul(200).add(50 * level),
                level => new Decimal(1 + 0.2 * (Math.max(10, level) / 10) * level * Math.max(((level / 10) - 3), 1)),
                {
                    maxLevel: 100,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x", "", { namesAfter: 1e9 })
                })
        },
        getResetAmount: function () {
            if (game.scrapThisPrestige.lte(new Decimal(1e15))) {
                return new Decimal(0);
            }
            let base = Decimal.floor(Decimal.pow(Decimal.log10(game.scrapThisPrestige) - 14, 1.5).mul(10))
                .add(25);
            base = base.mul(Decimal.pow(1.1, Math.max(0, Decimal.log10(game.scrapThisPrestige) - 27)))
                .mul(applyUpgrade(game.magnetUpgrades.moreGoldenScrap))
                .mul(applyUpgrade(game.mergeQuests.upgrades.goldenScrapBoost))
                .mul(game.mergeMastery.prestige.currentGSBoost())
                .mul(applyUpgrade(game.tires.upgrades[2][2])).add(55)
                .mul(applyUpgrade(game.goldenScrap.upgrades.gsBoost))
                .mul(applyUpgrade(game.angelbeams.upgrades.gsBoost))
                .mul(applyUpgrade(game.barrelMastery.upgrades.goldenScrapBoost).pow(getTotalLevels(2)))
                .mul(1 + (applyUpgrade(game.darkscrap.upgrades.darkScrapGoldenScrap) * game.darkscrap.amount));
            if (game.dimension == 0 || game.goldenScrap.amount.gte(base)) return base;
            else return game.goldenScrap.amount.div(100)
        },
        reset: function () {
                game.goldenScrap.amount = game.goldenScrap.amount.add(game.goldenScrap.getResetAmount());
                game.stats.totalgsresets = game.stats.totalgsresets.add(1);
                for (let i = 0; i < barrels.length; i++) {
                    barrels[i] = undefined;
                }
                freeSpots = 20;
                draggedBarrel = undefined;
                if(!timeMode) game.mergesThisPrestige = 0;
                game.scrap = new Decimal(0);
                game.scrapThisPrestige = new Decimal(0);
                for (let upg of Object.keys(game.scrapUpgrades)) {
                    game.scrapUpgrades[upg].level = 0;
                }
                game.settings.barrelGalleryPage = 0;
                Scene.loadScene("Barrels");
        },
        getBoost: function () {
            return applyUpgrade(game.solarSystem.upgrades.mercury).mul(game.goldenScrap.amount).add(1);
        }
    },
    scrapUpgrades:
    {
        betterBarrels: new ScrapUpgrade(
            level => {
                let pow =
                    [
                        Decimal.pow(2, Math.min(10, level)),
                        Decimal.pow(4, Math.max(0, level - 10)),
                        Decimal.pow(2, Math.ceil(Math.max(0, level - 29) / 10)),
                        Decimal.pow(2, Math.ceil(Math.max(0, level - 54) / 10)),
                        Decimal.pow(1.2, Math.max(0, level - 500)),
                        Decimal.pow(1.2, Math.max(0, level - 1250)),
                        Decimal.pow(1.2, Math.max(0, level - 2500)),
                        Decimal.pow(1.2, Math.max(0, level - 5000))
                    ];

                let result = new Decimal(25000);
                for (let d of pow) {
                    result = result.mul(d);
                }
                return result;
            },
            level => new Decimal(level),
            {
                onBuy: function () {
                    trophyMergeCounter = 0;

                    // 1 to 10
                    if (game.ms.includes(85) == false) {
                        if (barrels[0] != undefined && barrels[1] != undefined && barrels[2] != undefined && barrels[3] != undefined && barrels[4] != undefined && barrels[5] != undefined && barrels[6] != undefined && barrels[7] != undefined && barrels[8] != undefined && barrels[9] != undefined) {
                            if (barrels[0].level.toFixed(0) == 0 && barrels[1].level.toFixed(0) == 1 && barrels[2].level.toFixed(0) == 2 && barrels[3].level.toFixed(0) == 3 && barrels[4].level.toFixed(0) == 4 && barrels[5].level.toFixed(0) == 5 && barrels[6].level.toFixed(0) == 6 && barrels[7].level.toFixed(0) == 7 && barrels[8].level.toFixed(0) == 8 && barrels[9].level.toFixed(0) == 9) {
                                game.ms.push(85);
                                GameNotification.create(new MilestoneNotificaion(86));
                            }
                        }
                    }

                    // 69
                    if (game.ms.includes(87) == false & !barrels.includes(undefined)) {
                        if (trophyProgress != 87001) {
                            if (barrels[0] != undefined && barrels[1] != undefined && barrels[2] != undefined && barrels[3] != undefined && barrels[4] != undefined && barrels[8] != undefined && barrels[9] != undefined && barrels[10] != undefined && barrels[11] != undefined && barrels[12] != undefined && barrels[15] != undefined && barrels[16] != undefined && barrels[17] != undefined && barrels[18] != undefined && barrels[19] != undefined) {
                                if (barrels[0].level.toFixed(0) == barrels[1].level.toFixed(0) && barrels[1].level.toFixed(0) == barrels[2].level.toFixed(0) && barrels[2].level.toFixed(0) == barrels[3].level.toFixed(0) && barrels[3].level.toFixed(0) == barrels[4].level.toFixed(0) && barrels[4].level.toFixed(0) != barrels[5].level.toFixed(0) && barrels[4].level.toFixed(0) == barrels[8].level.toFixed(0) && barrels[8].level.toFixed(0) == barrels[9].level.toFixed(0) && barrels[9].level.toFixed(0) == barrels[10].level.toFixed(0) && barrels[10].level.toFixed(0) == barrels[11].level.toFixed(0) && barrels[11].level.toFixed(0) == barrels[12].level.toFixed(0) && barrels[12].level.toFixed(0) != barrels[13].level.toFixed(0) && barrels[12].level.toFixed(0) == barrels[15].level.toFixed(0) && barrels[15].level.toFixed(0) == barrels[16].level.toFixed(0) && barrels[16].level.toFixed(0) == barrels[19].level.toFixed(0)) {
                                    trophyProgress = 87001;
                                }
                            }
                        }
                        else if (trophyProgress == 87001 & !barrels.includes(undefined)) {
                            if (barrels[0] != undefined && barrels[1] != undefined && barrels[2] != undefined && barrels[3] != undefined && barrels[4] != undefined && barrels[7] != undefined && barrels[8] != undefined && barrels[9] != undefined && barrels[10] != undefined && barrels[11] != undefined && barrels[15] != undefined && barrels[16] != undefined && barrels[17] != undefined && barrels[18] != undefined && barrels[19] != undefined) {
                                if (barrels[0].level.toFixed(0) == barrels[1].level.toFixed(0) && barrels[1].level.toFixed(0) == barrels[2].level.toFixed(0) && barrels[2].level.toFixed(0) == barrels[3].level.toFixed(0) && barrels[3].level.toFixed(0) == barrels[4].level.toFixed(0) && barrels[4].level.toFixed(0) != barrels[5].level.toFixed(0) && barrels[4].level.toFixed(0) == barrels[7].level.toFixed(0) && barrels[8].level.toFixed(0) == barrels[9].level.toFixed(0) && barrels[9].level.toFixed(0) == barrels[10].level.toFixed(0) && barrels[10].level.toFixed(0) == barrels[11].level.toFixed(0) && barrels[11].level.toFixed(0) != barrels[12].level.toFixed(0) && barrels[14].level.toFixed(0) != barrels[15].level.toFixed(0) && barrels[15].level.toFixed(0) == barrels[16].level.toFixed(0) && barrels[16].level.toFixed(0) == barrels[17].level.toFixed(0) && barrels[16].level.toFixed(0) == barrels[19].level.toFixed(0)) {
                                    game.ms.push(87);
                                    GameNotification.create(new MilestoneNotificaion(88));
                                    trophyProgress = 0;
                                }
                            }
                        }
                    }

                    // Pastaring
                    if (game.ms.includes(88) == false) {
                        if (barrels[0] != undefined && barrels[3] != undefined) {
                            if ((barrels[0].level.toFixed(0) == 343 || barrels[0].level.toFixed(0) == 344) && barrels[3].level.toFixed(0) == 353) {
                                game.ms.push(88);
                                GameNotification.create(new MilestoneNotificaion(89));
                            }
                        }
                    }

                    this.onBuyMax(this.level);

                },
                onLevelDown: function (level) {
                    for (let i = 0; i < barrels.length; i++) {
                        barrels[i] = new Barrel(level);
                    }
                },
                onBuyMax: function (level) {
                    for (let i = 0; i < barrels.length; i++) {
                        if (barrels[i] !== undefined && barrels[i].level < applyUpgrade(this).toNumber() + 1) {
                            barrels[i] = new Barrel(applyUpgrade(this).toNumber() + 1);
                        }
                    }
                },
                maxLevel: 3000,
            }),
        fasterBarrels: new ScrapUpgrade(
            level => {
                let pow = Decimal.pow(5, Math.max(0, level - 25));
                let pow2 = Decimal.pow(5, Math.max(0, level - 100));
                return Decimal.pow(5, level).mul(pow).mul(pow2).mul(10000)
            },
            level => new Decimal(2.5 / (1 + 0.1 * level)).mul(timeMode ? 1 : applyUpgrade(game.tires.upgrades[0][0])),
            {
                getEffectDisplay: function () {
                    let s = this.getEffect(this.level).toNumber();
                    if (s > 0.5) {
                        return s.toFixed(2) + "s";
                    }
                    if (s > 0.01) {
                        return (s * 1000).toFixed(0) + "ms";
                    }
                    if (s > 0.001) {
                        return (s * 1000).toFixed(2) + "ms";
                    }
                    if (s > 0.00001) {
                        return (s * 1000000).toFixed(0) + "µs";
                    }
                    return "Insanely fast!";
                }
            })
    },
    magnetUpgrades:
    {
        scrapBoost: new MagnetUpgrade(
            level => Utils.roundBase(new Decimal(10 + 5 * level).mul(Decimal.pow(1.1, Math.max(0, level - 10))), 1)
                .mul(applyUpgrade(game.solarSystem.upgrades.jupiter)),
            level => new Decimal(1 + 0.2 * level).mul(Decimal.pow(1.2, Math.max(0, level - 10))),
            {
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x")
            }),
        moreGoldenScrap: new MagnetUpgrade(
            level => Utils.roundBase(new Decimal(30 + 10 * level).mul(Decimal.pow(1.07, Math.max(0, level - 20))), 1)
                .mul(applyUpgrade(game.solarSystem.upgrades.jupiter)),
            level => new Decimal(1 + 0.3 * level),
            {
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x")
            }),
        magnetMergeChance: new MagnetUpgrade(
            level => new Decimal(10 + level * level).mul(Decimal.pow(2, Math.max(0, level - 20)))
                .mul(applyUpgrade(game.solarSystem.upgrades.jupiter)),
            level => new Decimal(0.01 + 0.001 * level),
            {
                getEffectDisplay: effectDisplayTemplates.percentStandard(1),
                maxLevel: () => 20 + (game.solarSystem.upgrades.earth.level >= EarthLevels.MAGNET_3_LEVELS ? 20 : 0)
            }),
        autoMerger: new MagnetUpgrade(
            level => new Decimal(100).mul(Decimal.pow(1.3, level))
                .mul(applyUpgrade(game.solarSystem.upgrades.jupiter)),
            level => new Decimal(1 + 0.05 * level),
            {
                getEffectDisplay: effectDisplayTemplates.percentStandard(0),
                maxLevel: 30
            }),
        brickSpeed: new MagnetUpgrade(
            level => new Decimal(1e12).mul(Decimal.pow(2, level))
                .mul(applyUpgrade(game.solarSystem.upgrades.jupiter)),
            level => new Decimal(1 / (1 + 0.02 * level)),
            {
                getEffectDisplay: effectDisplayTemplates.percentStandard(1),
                maxLevel: 75
            })
    },
    solarSystem:
    {
        upgrades:
        {
            sun: new MagnetUpgrade(
                level => new Decimal(100 + 50 * level).mul(Decimal.pow(1.25, Math.floor(level / 50))),
                level => Decimal.pow(1 + 0.1 * level, 10),
                {
                    maxLevel: 5000,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x", "", { namesAfter: 1e12 })
                }
            ),
            mercury: new MagnetUpgrade(
                level => new Decimal(100 + 75 * level).mul(Decimal.pow(1.1, Math.max(0, level - 20))),
                level => new Decimal(0.01 + 0.01 * level),
                {
                    maxLevel: 999,
                    getEffectDisplay: effectDisplayTemplates.percentStandard(0)
                }
            ),
            venus: new ScrapUpgrade(
                level => Decimal.pow(10, 50 + level * 5),
                level => new Decimal((1 - Math.pow(0.8, Math.max(0, level - 1))) * 0.3 + (level > 0 ? 0.2 : 0)),
                {
                    maxLevel: 30,
                    getEffectDisplay: effectDisplayTemplates.percentStandard(1)
                }
            ),
            earth: new GoldenScrapUpgrade(
                level => new Decimal([1e5, 250e9, 2e12, 10e12, 50e12, 1e17, 1e24, 5e24, 7.7777e25, 1e27, 1e40, 1e100, 1e150][level]),
                level => ["Nothing", "Buy Max", "Mars", "+20 Levels for\n3rd Magnet Upgrade",
                    "Jupiter", "Saturn", "Uranus", "Neptune", "The Skill Tree", "+200 Levels for\n5th Brick Upgrade", "Angel Beams", "Second Dimension", "Scrap Factory", "Gifts"][level],
                {
                    maxLevel: 13,
                    getEffectDisplay: function () {
                        if (this.level === this.maxLevel) {
                            return "Unlocked everything!";
                        }
                        return "Unlock " + this.getEffect(this.level + 1);
                    }
                }
            ),
            mars: new FragmentUpgrade(
                level => new Decimal(1000).mul(level + 1),
                level => new Decimal(180 / (1 + 0.2 * level)).mul(applyUpgrade(game.tires.upgrades[2][0])),
                {
                    maxLevel: 10,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0, "", "s")
                }
            ),
            jupiter: new MergeTokenUpgrade(
                level => Decimal.min(10, level + 3),
                level => Decimal.pow(0.85, level),
                {
                    maxLevel: 25,
                    getEffectDisplay: effectDisplayTemplates.percentStandard(1)
                }
            ),
            saturn: new ScrapUpgrade(
                level => Decimal.pow(64, Math.pow(level, 1.25)).mul(1e183),
                level => Decimal.pow(0.9675, level).mul(2).mul(applyUpgrade(game.tires.upgrades[2][1]))
                    .div(applyUpgrade(game.magnetUpgrades.autoMerger)).div((game.skillTree.upgrades.fasterAutoMerge.level / 2) + 1),
                {
                    maxLevel: 40,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "s")
                }
            ),
            uranus: new MagnetUpgrade(
                level => Utils.roundBase(Decimal.pow(3, level).mul(1e9), 1),
                level => new Decimal(1 + 0.25 * level),
                {
                    maxLevel: 16,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x^")
                }
            ),
            neptune: new TireUpgrade(
                level => Decimal.pow(1e15, level * Math.pow(1.4, Math.min(level, 18)) * (1 + Math.pow(1.15, Math.max(level - 20, 0)))).mul(new Decimal("1e100")),
                level => new Decimal(0.01 * level).mul(getMagnetBaseValue()).mul(applyUpgrade(game.tires.upgrades[3][0])), {
                maxLevel: () => 20 + applyUpgrade(game.skillTree.upgrades.higherNeptuneMax),
                getEffectDisplay: effectDisplayTemplates.numberStandard(0, "+", "/s")
            }
            ),

            astro: new GoldenScrapUpgrade(
                level => new Decimal(1e30).pow(1 + level / 133).mul(Math.max(1, Math.round((level / 3) - 7))).mul(Math.max(1, level - 11))
                .mul(Math.max(1, level - 25)).mul(1 + level * 1.17).mul(level > 99 ? Math.pow(level - 97, 15) : 1),
                level => 0.02 * level,
                {
                    maxLevel: () => 100 + (game.skillTree.upgrades.higherAstroMax.level > 0 ? 25 : 0),
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "-", "s")
                }
            ),

            mythus: new BarrelUpgrade(
                level => new Decimal(3010 + (20 * level) - (game.skillTree.upgrades.cheaperMythus.level * 2)),
                level => 20 * level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0, "+"),
                    afterBuy: () => {
                        if (game.solarSystem.upgrades.mythus.level == 0 && game.highestBarrelReached < 3009) {
                            alert("You have to reach barrel 3010 to upgrade this planet!");
                        }
                        else {
                            try {
                                updateBetterBarrels()
                            }
                            finally {

                            }
                        }
                    }
                }
            ),

            posus: new MagnetUpgrade(
                level => new Decimal(1).mul(new Decimal(10).pow(level)),
                level => new Decimal(1.2).pow(level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x")
                }
            ),



        }
    },
    stats:
    {
        playtime: new Decimal(0),
        totalwrenches: new Decimal(0),
        totalbeams: new Decimal(0),
        totalaerobeams: new Decimal(0),
        totalangelbeams: new Decimal(0),
        totalreinforcedbeams: new Decimal(0),
        totalglitchbeams: new Decimal(0),
        totalbeamscollected: new Decimal(0),
        totalaerobeamscollected: new Decimal(0),
        totalangelbeamscollected: new Decimal(0),
        totalreinforcedbeamscollected: new Decimal(0),
        totalglitchbeamscollected: new Decimal(0),
        totalgoldenbeamscollected: new Decimal(0),
        totalquests: new Decimal(0),
        totalmergetokens: new Decimal(0),
        totaldarkscrap: new Decimal(0),
        totalfragments: new Decimal(0),
        totaldarkfragments: new Decimal(0),
        totaltirescollected: new Decimal(0),
        totalgsresets: new Decimal(0),
        totaldailyquests: new Decimal(0),
        totallegendaryscrap: new Decimal(0),
        totalsteelmagnets: new Decimal(0),
        totalbluebricks: new Decimal(0),
        totalbuckets: new Decimal(0),
        totalfishingnets: new Decimal(0),
        totaltanks: new Decimal(0),
        totalmasterytokens: new Decimal(0),
        totalplasticbags: new Decimal(0),
        totalscrews: new Decimal(0),
        totalscrewscollected: new Decimal(0),
        giftsSent: new Decimal(0),
        giftsReceived: new Decimal(0),
    },
    mergeQuests:
    {
        isUnlocked: () => game.highestScrapReached.gte(1e93),
        quests: [new MergeQuest(300, [0, 1, 2]), new MergeQuest(450, [0, 1, 2, 3]), new MergeQuest(3, [2, 3, 4])],
        dailyQuest: new MergeQuest(12000, [5]),
        mergeTokens: new Decimal(0),
        scrapyard: 1,
        scrapyardProgress: 0,
        nextDaily: "20220721",
        upgrades:
        {
            scrapBoost: new MergeTokenUpgrade(level => Decimal.min(5, 1 + Math.floor(level / 4))
                .add(Utils.clamp(Math.floor(level / 100) - 1, 0, 5)),
                level => Decimal.pow(1.2, level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1),
                    maxLevel: () => 100 + applyUpgrade(game.bricks.upgrades.questLevels)
                }),
            goldenScrapBoost: new MergeTokenUpgrade(level => Decimal.min(10, 2 + 2 * Math.floor(level / 4)),
                level => new Decimal(1 + level * 0.3 + Math.max(level - 20, 0) * 0.4).mul(Decimal.pow(1.01, Math.max(0, level - 100))),
                {
                    getEffectDisplay: effectDisplayTemplates.percentStandard(0),
                    maxLevel: () => 75 + applyUpgrade(game.bricks.upgrades.questLevels)
                }),
            magnetBoost: new MergeTokenUpgrade(level => Decimal.min(10, 3 + 2 * Math.floor(level / 4)),
                level => Decimal.pow(1.05, Utils.clamp(level, 0, 150))
                    .mul(Decimal.pow(1.02, Math.max(level - 150, 0))),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2),
                    maxLevel: () => 50 + applyUpgrade(game.bricks.upgrades.questLevels)
                }),
            fallingMagnetValue: new MergeTokenUpgrade(level => new Decimal(15),
                level => new Decimal(1 + level), {
                getEffectDisplay: effectDisplayTemplates.numberStandard(2),
                maxLevel: 15
            })
        }
    },
    mergeMastery:
    {
        isUnlocked: () => game.highestScrapReached.gte(1e153),
        level: 0,
        currentMerges: 0,
        getNeededMerges: level => Math.round((100 + 10 * level) * applyUpgrade(game.tires.upgrades[0][2])
            .toNumber() / ((game.mergeQuests.scrapyard / 100) + 0.99) / (1 + (applyUpgrade(game.skillTree.upgrades.fasterMergeMastery)/100))),
        getScrapBoost: level => new Decimal(1 + 0.05 * level).pow(applyUpgrade(game.solarSystem.upgrades.uranus)),
        getMagnetBonus: level => Decimal.round(getMagnetBaseValue().mul(2 + 0.25 * level)),
        check: () => {
            if (game.mergeMastery.currentMerges >= game.mergeMastery.getNeededMerges(game.mergeMastery.level)) {
                game.mergeMastery.levelUp();
            }
        },
        levelUp: () => {
            game.magnets = game.magnets.add(game.mergeMastery.getMagnetBonus(game.mergeMastery.level));
            game.mergeMastery.currentMerges = 0;
            if (game.mergeMastery.getNeededMerges(game.mergeMastery.level) >= 100) {
                GameNotification.create(new MasteryLevelUpNotification(game.mergeMastery.level));
            }

            if (game.screws.isUnlocked()) {
                game.screws.amount = game.screws.amount.add(game.screws.getScrews(game.mergeMastery.level));
                game.stats.totalscrews = game.stats.totalscrews.add(game.screws.getScrews(game.mergeMastery.level));
            }

            game.mergeMastery.level++;
            if (game.mergeMastery.level > game.highestMasteryLevel) game.highestMasteryLevel = game.mergeMastery.level;
        },
        prestige:
        {
            level: 0,
            reset: () => {
                if (game.mergeMastery.level > 50) {
                    game.mergeMastery.prestige.level += game.mergeMastery.level - 49;
                    game.mergeMastery.level = 0;
                    game.mergeMastery.currentMerges = 0;
                }
            },
            getGoldenScrapBoost: level => new Decimal(1 + 0.02 * level).mul(applyUpgrade(game.angelbeams.upgrades.moreMasteryGS)).pow(applyUpgrade(game.skillTree.upgrades.strongerMasteryGS) + Math.log(level)),
            currentGSBoost: () => game.mergeMastery.prestige.getGoldenScrapBoost(game.mergeMastery.prestige.level),
            getMagnetBoost: level => new Decimal(1 + 0.01 * level).pow(applyUpgrade(game.skillTree.upgrades.strongerMasteryMagnets) + Math.log(level)),
            currentMagnetBoost: () => game.mergeMastery.prestige.getMagnetBoost(game.mergeMastery.prestige.level)
        }
    },
    gifts:
    {
        isUnlocked: () => game.solarSystem.upgrades.earth.level >= EarthLevels.GIFTS,
        openLimit: 3,
        sendLimit: 2,
        openedToday: [],
    },
    bricks:
    {
        amount: new Decimal(0),
        productionLevel: 0,
        currentMergeProgress: 0,
        mergesPerLevel: () => Math.max(8, Math.round((250 * applyUpgrade(game.tires.upgrades[0][1]).toNumber() * applyUpgrade(game.magnetUpgrades.brickSpeed).toNumber() * (1 - game.skillTree.upgrades.fasterBricks.level / 100) / (1 + applyUpgrade(game.screws.upgrades.fasterBricks) / 100)) * ((0.75 * game.reinforcedbeams.upgrades.reinforcedbricks.level)+1) )),
        isUnlocked: () => game.highestScrapReached.gte(1e213),
        getProduction: level => {
            if (level === 0) {
                return new Decimal(0);
            }
            return Decimal.pow(2, level - 1)
                .mul(applyUpgrade(game.bricks.upgrades.brickBoost))
                .mul(applyUpgrade(game.skillTree.upgrades.brickBoost))
                .mul(new Decimal(applyUpgrade(game.barrelMastery.upgrades.brickBoost)).pow((getTotalLevels(3))));
        },
        getCurrentProduction: () => {
            return game.bricks.getProduction(game.bricks.productionLevel);
        },
        check: function () {
            if (game.settings.autoMerge == false) {
                if (Math.random() < (applyUpgrade(game.wrenches.upgrades.instantBricksChance)) / 100) {
                    game.bricks.currentMergeProgress += 15;
                }
            }
            if (game.bricks.currentMergeProgress >= game.bricks.mergesPerLevel()) {
                game.bricks.productionLevel += getBrickIncrease();
                game.bricks.currentMergeProgress = 0;
            }
        },
        onMerge: function () {
            game.bricks.currentMergeProgress++;
            game.bricks.check();
        },
        upgrades:
        {
            scrapBoost: new BrickUpgrade(level => Decimal.pow(8, level + Math.pow(Math.max(0, level - 50), 1.2))
                .mul(100)
                .pow(1 + 0.001 * Math.max(0, level - 10000)),
                level => Decimal.pow(1.1, level),
                {
                    maxLevel: 100000,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1),
                }),
            magnetBoost: new BrickUpgrade(level => (Decimal.pow(32, level + Math.pow(0.75 * Math.max(0, level - 50), 1.25))
                .mul(100e3)).pow(Decimal.pow(1.01, Math.max(0, level - 250))),
                level => Decimal.pow(1.025, level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2)
                }),
            brickBoost: new BrickUpgrade(level => Decimal.pow(64, Math.pow(level, 1.1)).mul(1e12),
                level => Decimal.pow(4, level),
                {
                    maxLevel: 100000,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0)
                }),
            questSpeed: new BrickUpgrade(level => Decimal.pow(1e10, level).mul(1e100),
                level => new Decimal(1 - 0.01 * level),
                {
                    maxLevel: 50,
                    afterBuy: function () {
                        for (let q of game.mergeQuests.quests) {
                            q.check(-1); //refresh to prevent overflow of merges
                        }
                    },
                    getEffectDisplay: effectDisplayTemplates.percentStandard(0)
                }),
            questLevels: new BrickUpgrade(level => Decimal.pow(1e12, level + Math.pow(Math.max(level - 100, 0), 1.2))
                .mul(1e30),
                level => level,
                {
                    maxLevel: () => 100 + (game.solarSystem.upgrades.earth.level >= EarthLevels.BRICK_3_LEVELS ? 200 : 0),
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0, "+")
                }),
            fasterCrafting: new BrickUpgrade(level => new Decimal("1e5000").pow(new Decimal(level + Math.pow(Math.max(level - 25, 0), 1.2)))
                .mul("1e20000"),
                level => level / 5,
                {
                    maxLevel: () => 250,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "-", "%"),
                    isUnlocked: () => applyUpgrade(game.shrine.generatorUnlock)
                })
        },
        maxUpgrades: function () {
            for (k in game.bricks.upgrades) {
                let upg = game.bricks.upgrades[k];
                while (upg.currentPrice().lte(game.bricks.amount) && upg.level < upg.getMaxLevel() && upg.isUnlocked != false) {
                    upg.buy();
                }
            }
        }
    },
    tires:
    {
        amount: new Decimal(0),
        value: new Decimal(1),
        isUnlocked: () => game.highestBarrelReached >= 499,
        time: 600,
        getCombinedRowLevel: arr => {
            let lvl = 0;
            for (let upg of arr) {
                lvl += upg.level;
            }
            return lvl;
        },
        onMerge: () => {
            if (Math.random() < applyUpgrade(game.tires.upgrades[1][1])) {
                if (!timeMode) movingItemFactory.jumpingTire();
                else timeTires += 1;
            }
        },
        milestones: [new Decimal(0), new Decimal(1e63), Decimal.pow(2, 1024), () => applyUpgrade(game.skillTree.upgrades.newTireUpgrades)],
        getLevelBias: level => Math.pow(Math.max(level - 100, 0), 1.7),
        upgrades:
            [
                [ //faster barrels, faster Brick level up, faster Merge Mastery
                    new TireUpgrade(level => Decimal.pow(4, Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[0]) / 2, 1.10) + game.tires.getLevelBias(level))
                        .mul(10),
                        level => new Decimal(1 / (1 + 0.03 * level)),
                        {
                            getEffectDisplay: effectDisplayTemplates.percentStandard(1)
                        }),
                    new TireUpgrade(level => Decimal.pow(4, Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[0]) / 2, 1.10) + game.tires.getLevelBias(level))
                        .mul(100),
                        level => new Decimal(1 / (1 + 0.01 * level)),
                        {
                            maxLevel: 1900,
                            getEffectDisplay: effectDisplayTemplates.percentStandard(1),
                            afterBuy: () => game.bricks.check()
                        }),
                    new TireUpgrade(level => Decimal.pow(4, Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[0]) / 2, 1.10) + game.tires.getLevelBias(level))
                        .mul(1000),
                        level => new Decimal(1 / (1 + 0.01 * level)),
                        {
                            maxLevel: 1000,
                            getEffectDisplay: effectDisplayTemplates.percentStandard(1),
                            afterBuy: () => game.mergeMastery.check()
                        })
                ],
                [ //more xTires per collect, Tire chance, faster Merge Quests
                    new TireUpgrade(level => Decimal.pow(32, Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[1]) / 2, 1.15) + game.tires.getLevelBias(level))
                        .mul(10e63),
                        level => new Decimal(1.3 + 0.05 * level + 0.01 * Math.pow(Math.max(level - 70, 0), 2)).mul(1 + game.skillTree.upgrades.tireValue.level).mul(applyUpgrade(game.aerobeams.upgrades.moreTires)).mul(applyUpgrade(game.plasticBags.upgrades.moreTires)).pow(applyUpgrade(game.skillTree.upgrades.tireBoost)).pow(applyUpgrade(game.skillTree.upgrades.tireBoost2)),
                        {
                            getEffectDisplay: effectDisplayTemplates.numberStandard(2)
                        }),
                    new TireUpgrade(level => Decimal.pow(32, Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[1]) / 2, 1.15) + game.tires.getLevelBias(level))
                        .mul(10e66),
                        level => new Decimal(0.005 * (1 + 0.02 * level)),
                        {
                            maxLevel: 50,
                            getEffectDisplay: effectDisplayTemplates.percentStandard(2)
                        }),
                    new TireUpgrade(level => Decimal.pow(32, Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[1]) / 2, 1.15) + game.tires.getLevelBias(level))
                        .mul(10e69),
                        level => new Decimal(1 / (1 + 0.005 * level)), {
                        maxLevel: 100,
                        getEffectDisplay: effectDisplayTemplates.percentStandard(1),
                        afterBuy: function () {
                            for (let q of game.mergeQuests.quests) {
                                q.check(-1); //refresh to prevent overflow of merges
                            }
                        }
                    }),
                ],
                [ //faster falling Magnets, faster Auto Merge, more GS
                    new TireUpgrade(level => Decimal.pow(Math.pow(2, 15), Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[2]) / 2, 1.20) + game.tires.getLevelBias(level))
                        .mul(Decimal.pow(2, 1034)),
                        level => Decimal.pow(0.99, level), {
                        maxLevel: 50,
                        getEffectDisplay: effectDisplayTemplates.percentStandard(1)
                    }),
                    new TireUpgrade(level => Decimal.pow(Math.pow(2, 15), Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[2]) / 2, 1.20) + game.tires.getLevelBias(level))
                        .mul(Decimal.pow(2, 1134)),
                        level => Decimal.pow(0.99, level),
                        {
                            maxLevel: 50,
                            getEffectDisplay: effectDisplayTemplates.percentStandard(1)
                        }),
                    new TireUpgrade(level => Decimal.pow(Math.pow(2, 15), Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[2]) / 2, 1.20) + game.tires.getLevelBias(level))
                        .mul(Decimal.pow(2, 1234)),
                        level => new Decimal(1 + 0.1 * level + 0.01 * level * level),
                        {
                            getEffectDisplay: effectDisplayTemplates.numberStandard(1)
                        }),
                ],
                [ //more passive magnets, more beams, cheaper plastic bags
                    new TireUpgrade(level => Decimal.pow(Decimal.pow(2, 2555), Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[3]) / 2, 1.25) + game.tires.getLevelBias(level))
                        .mul("1e500000"),
                        level => new Decimal(1).add(0.2 * level), {
                        maxLevel: 495,
                            getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x")
                    }),
                    new TireUpgrade(level => Decimal.pow(Decimal.pow(2, 187500), Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[3]) / 2, 1.25) + game.tires.getLevelBias(level))
                        .mul("1e750000"),
                        level => 1 + (0.02 * level),
                        {
                            maxLevel: 100,
                            getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x")
                        }),
                    new TireUpgrade(level => Decimal.pow(Decimal.pow(2, 5555), Math.pow(level / 2 + game.tires.getCombinedRowLevel(game.tires.upgrades[3]) / 2, 1.25) + game.tires.getLevelBias(level))
                        .mul("1e1000000"),
                        level => (10 + (level > 99 ? 5 : 0)) * level,
                        {
                            getEffectDisplay: effectDisplayTemplates.numberStandard(1, "-", "L")
                        }),
                ]
            ]
    },
    fragment:
    {
        isUnlocked: () => game.highestBarrelReached >= 100,
        amount: new Decimal(0),
        upgrades:
        {
            scrapBoost: new FragmentUpgrade(
                level => new Decimal(100).mul(new Decimal(1.1).pow(level)),
                level => new Decimal(1 + (0.5 * level)).mul(new Decimal(1.1).pow(Math.max(0, level - 15))),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1)
                }),
            magnetBoost: new FragmentUpgrade(
                level => new Decimal(500).mul(new Decimal(1.1).pow(level)),
                level => new Decimal(1 + (0.2 * level)).mul(new Decimal(1.05).pow(Math.max(0, level - 15))),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1)
                }),
        },
    },
    darkscrap:
    {
        isUnlocked: () => game.solarSystem.upgrades.earth.level >= EarthLevels.SECOND_DIMENSION,
        amount: new Decimal(0),
        upgrades:
        {
            darkScrapBoost: new DarkScrapUpgrade(
                level => new Decimal(100 + (level * 13 * Math.pow(1.3, level)) * Math.pow(1.2, Math.max(0, level - 49)) * Math.pow(1.7, Math.max(0, level - 99))),
                level => 1 + (0.3 * level) * Math.pow(1.2, Math.max(0, level - 15)),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1)
                }),
            mergeTokenBoost: new DarkScrapUpgrade(
                level => new Decimal(200 + (50 * level)).mul(new Decimal(Math.max(1, level - 10)).pow(1.3, level)).pow(Math.max(1, (level / 4) - 12)),
                level => 1 + (level / 10),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1),
                    maxLevel: () => 50 + applyUpgrade(game.skillTree.upgrades.higherDarkScrapTokenMax)
                }),
            goldenScrapBoost: new DarkScrapUpgrade(
                level => new Decimal(Math.min((100 + (10 * level)) * Math.pow(1.05, Math.max(0, level - 20)), 1000000)),
                level => 0, //0.01 * level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2)
                }),
            darkScrapGoldenScrap: new DarkScrapUpgrade(
                level => new Decimal(1000).mul(Math.pow(1.25, level)),
                level => new Decimal(Math.pow(1.1, level) / 10 - 0.1).mul(Math.max(1, level - 24) * 50 - 49),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2)
                }),
            strongerTiers: new DarkScrapUpgrade(
                level => new Decimal(1e9).mul(Math.pow(2.87, level)),
                level => 3 + (0.01 * level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2),
                    maxLevel: 200
                }),
        },
    },
    darkfragment:
    {
        isUnlocked: () => game.solarSystem.upgrades.earth.level >= EarthLevels.SECOND_DIMENSION,
        amount: new Decimal(0),
        upgrades:
        {
            scrapBoost: new DarkFragmentUpgrade(
                level => new Decimal(100).mul(new Decimal(1.1).pow(level)),
                level => new Decimal(100).pow(level).mul(new Decimal(1.3).pow(Math.max(0, level - 5))).mul(new Decimal(5.7).pow(Math.max(0, level - 100))),
                {
                    isUnlocked: () => game.solarSystem.upgrades.earth.level >= EarthLevels.SECOND_DIMENSION,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1)
                }),
            moreFragments: new DarkFragmentUpgrade(
                level => new Decimal(100).mul(new Decimal(1.1).pow(level)),
                level => new Decimal(1 + (0.3 * level)).mul(Math.max(1, level / 33)),
                {
                    isUnlocked: () => game.solarSystem.upgrades.earth.level >= EarthLevels.SECOND_DIMENSION,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1)
                }),
        },
    },
    cogwheels:
    {
        isUnlocked: () => true,
        timeModeAttempts: 3,
        amount: new Decimal(0),
        upgrades: {
            scrapBoost: new CogwheelUpgrade(
                level => new Decimal(Math.sqrt(level)).add(1.2).pow(3.5),
                level => new Decimal(13.7).pow(level * 7),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x")
                }),
            darkScrapBoost: new CogwheelUpgrade(
                level => new Decimal(Math.sqrt(level)).add(2).pow(3.5),
                level => new Decimal(1.4).pow(level * 3),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x")
                }),
        }
    },
    beams:
    {
        isUnlocked: () => game.highestBarrelReached > 299,
        amount: new Decimal(0),
        time: 0,
        selected: 0,
        upgrades:
        {
            fasterBeams: new BeamUpgrade(
                level => new Decimal(5 * (Math.round(level / 3) + 1)),
                level => 0.25 * level,
                {
                    maxLevel: 60,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "-", "s")
                }),
            beamValue: new BeamUpgrade(
                level => new Decimal(25 * ((level * Math.min(19, Math.max(9, level))) + 1)),
                level => 1 + level,
                {
                    maxLevel: 12,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+", "/collect")
                }),
            beamStormChance: new BeamUpgrade(
                level => new Decimal(10 + level),
                level => 0.1 * level,
                {
                    maxLevel: () => (100 + (applyUpgrade(game.skillTree.upgrades.fourthMaxLevel) ? 50 : 0)),
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "+", "%")
                }),
            beamStormValue: new BeamUpgrade(
                level => new Decimal(500 + (100 * level)),
                level => level,
                {
                    maxLevel: 5,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+")
                }),
            moreScrap: new BeamUpgrade(
                level => new Decimal(5 + Math.round(level / 10)),
                level => new Decimal(1.3).pow(level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x")
                }),
            moreMagnets: new BeamUpgrade(
                level => new Decimal(10 + Math.round(level / 10)),
                level => new Decimal(1.03).pow(level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x")
                }),
            slowerBeams: new BeamUpgrade(
                level => new Decimal(5 * (Math.round(level / 3) + 1)),
                level => 0.01 * level,
                {
                    maxLevel: 25,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "-", "s")
                }),
        },
    },

    aerobeams:
    {
        isUnlocked: () => game.skillTree.upgrades.unlockbeamtypes.level > 0,
        amount: new Decimal(0),
        upgrades:
        {
            fasterBeams: new AeroBeamUpgrade(
                level => new Decimal(5 * (Math.round(level / 3) + 1)),
                level => 0.5 * level,
                {
                    maxLevel: 30,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "-", "s")
                }),
            slowerFallingMagnets: new AeroBeamUpgrade(
                level => new Decimal(5 * (Math.round(level / 3) + 1)),
                level => 0.005 * level,
                {
                    maxLevel: 50,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "-")
                }),
            betterFallingMagnets: new AeroBeamUpgrade(
                level => new Decimal(25 * (Math.round(level / 3) + 1)),
                level => 1 + (0.1 * level),
                {
                    maxLevel: 50,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x")
                }),
            tireCloneChance: new AeroBeamUpgrade(
                level => new Decimal(500 * (Math.round(level / 2) + 1)),
                level => 1 * level,
                {
                    maxLevel: () => 10 + (applyUpgrade(game.skillTree.upgrades.fourthMaxLevel) ? 15 : 0),
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "%")
                }),
            unlockGoldenScrapStorms: new AeroBeamUpgrade(
                level => new Decimal(1200),
                level => level,
                {
                    maxLevel: 1,
                    getEffectDisplay: effectDisplayTemplates.unlock()
                }),
            moreTires: new AeroBeamUpgrade(
                level => new Decimal(5 + Math.round(level / 10)),
                level => new Decimal(1 + (0.1 * level)).pow(Math.max(1, (level + 400) / 500)),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x")
                }),
        }
    },

    angelbeams:
    {
        isUnlocked: () => game.skillTree.upgrades.unlockbeamtypes.level > 0 && game.solarSystem.upgrades.earth.level >= EarthLevels.ANGEL_BEAMS,
        amount: new Decimal(0),
        upgrades:
        {
            beamValue: new AngelBeamUpgrade(
                level => new Decimal(20 * (level + 1)),
                level => 1 + level,
                {
                    maxLevel: 99,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+", "/collect")
                }),
            fasterBeams: new AngelBeamUpgrade(
                level => new Decimal(40 * (level + 1)),
                level => 0.1 * level,
                {
                    maxLevel: 50,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "-", "s")
                }),
            moreMasteryGS: new AngelBeamUpgrade(
                level => new Decimal(70 * (Math.max(1, level - 14) + level)),
                level => 1 + (0.2 * level),
                {
                    maxLevel: 25,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x")
                }),
            goldenScrapStormChance: new AngelBeamUpgrade(
                level => new Decimal(50 * (level + level + 1)),
                level => 1 + (0.5 * level),
                {
                    maxLevel: () => 38 + (applyUpgrade(game.skillTree.upgrades.fourthMaxLevel) ? 10 : 0),
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "%/min")
                }),
            gsBoost: new AngelBeamUpgrade(
                level => new Decimal(20 + Math.round(level / 10)),
                level => new Decimal(1.217).pow(0.1 * level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x")
                }),
        }
    },
    reinforcedbeams:
    {
        isUnlocked: () => game.skillTree.upgrades.unlockbeamtypes.level > 0 && game.highestMasteryLevel > 299,
        amount: new Decimal(0),
        upgrades:
        {
            reinforce: new ReinforcedBeamUpgrade(
                level => new Decimal(5 * (level + 1) * Math.pow(1, Math.max(1, level - 11))),
                level => 1 + level,
                {
                    maxLevel: () => { return 99 + applyUpgrade(game.screws.upgrades.higherMoreReinforced) },
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+", "/collect")
                }),
            strength: new ReinforcedBeamUpgrade(
                level => new Decimal(30 * (level + 1) * Math.pow(1, Math.max(1, (level*2) - 18))),
                level => 2 * level,
                {
                    maxLevel: () => { return 50 + applyUpgrade(game.plasticBags.upgrades.higherEasierReinforced) },
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "-",)
                }),
            powerpunch: new ReinforcedBeamUpgrade(
                level => new Decimal(100 + (50 * level)),
                level => 3 * level,
                {
                    maxLevel: 10,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "%")
                }),
            reinforcedbricks: new ReinforcedBeamUpgrade(
                level => new Decimal( Math.floor(((Math.pow(1.5, Math.min(level, 10)) * 25) + 475) * Math.max(1, (level / 50) + 0.7))),
                level => level,
                {
                    maxLevel: () => 10 + (applyUpgrade(game.skillTree.upgrades.fourthMaxLevel) ? 40 : 0),
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "")
                }),
            factoryTankSize: new ReinforcedBeamUpgrade(
                level => new Decimal(2000 + (100 * level)),
                level => 10 * level,
                {
                    maxLevel: 58,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "+", "")
                }),
            fragmentBoost: new ReinforcedBeamUpgrade(
                level => new Decimal(25 + (5 * Math.floor(level / 25))),
                level => new Decimal(1.08).pow(level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x", "")
                }),
            darkFragmentBoost: new ReinforcedBeamUpgrade(
                level => new Decimal(25 + (5 * Math.floor(level / 25))),
                level => new Decimal(1.06).pow(level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "x", "")
                }),
        }
    },
    glitchbeams:
    {
        isUnlocked: () => game.glitchesCollected > 9,
        amount: new Decimal(0),
        upgrades:
        {
            beamValue: new GlitchBeamUpgrade(
                level => new Decimal(10 * level + 20),
                level => 1 + level,
                {
                    maxLevel: 24,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+", "/collect")
                }),
            repeat: new GlitchBeamUpgrade(
                level => new Decimal(Math.round(5 * (level / 3)) + 20),
                level => 0.5 * level,
                {
                    maxLevel: 100,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
                }),
            valueGlitch: new GlitchBeamUpgrade(
                level => new Decimal(Math.round(150 * Math.max(1, level / 6.543))),
                level => 0.1 * level,
                {
                    maxLevel: 30,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
                }),
            goldenbeam: new GlitchBeamUpgrade(
                level => new Decimal(Math.round(300 * Math.max(1, level / 3.492))),
                level => 0.1 * level,
                {
                    maxLevel: () => 10 + (applyUpgrade(game.skillTree.upgrades.fourthMaxLevel) ? 40 : 0),
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
                }),
            minimumValue: new GlitchBeamUpgrade(
                level => new Decimal(100 * level + 200),
                level => 1 + 1 * level,
                {
                    maxLevel: 14,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "Min. ")
                }),
        }
    },
    wrenches:
    {
        isUnlocked: () => game.selfMerges > 11999/*52919*/,
        amount: new Decimal(0),
        upgrades:
        {
            doubleMergeMastery: new WrenchUpgrade(
                level => new Decimal(10 + level),
                level => 0.5 * level,
                {
                    maxLevel: 200,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "% Chance")
                }),
            instantBricksChance: new WrenchUpgrade(
                level => new Decimal(50),
                level => 0.1 * level,
                {
                    maxLevel: 200,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "% Chance")
                }),
            wrenchScrapBoost: new WrenchUpgrade(
                level => new Decimal(10 * (1 + Math.round(level / 2))),
                level => new Decimal(Math.max(game.wrenches.amount, 1)).pow(((level / 50) * (100 / (1 + Math.pow(2.71828, (-0.000003 * game.wrenches.amount))) - 50))),
                {
                    maxLevel: 100,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x")
                }),
            fasterBeamChance: new WrenchUpgrade(
                level => new Decimal(Math.round(10 + (level * 5) + (Math.max(0.2, level-50) * 5) - 1)),
                level => level,
                {
                    maxLevel: 100,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0, "", "% Chance")
                }),
        }
    },
    plasticBags:
    {
        amount: new Decimal(0),
        currentResource: RESOURCE_MERGE_TOKEN,
        currentCosts: new Decimal(100),
        upgrades:
        {
            moreScrap: new PlasticBagUpgrade(
                level => new Decimal(1).add(Math.floor(level / 7)),
                level => new Decimal(1).mul(new Decimal(Math.max(1, level * 10)).pow(level).pow(Math.max(1, (level / 40)))).round(),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x")
                }),
            moreTires: new PlasticBagUpgrade(
                level => new Decimal(1).add(Math.floor(level / 9)),
                level => new Decimal(1 + Math.max(level, 1)).pow(level / 33),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x")
                }),
            higherEasierReinforced: new PlasticBagUpgrade(
                level => new Decimal(10).add(level * 2),
                level => level,
                {
                    maxLevel: 50,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+")
                }),
        }
    },
    screws:
    {
        amount: new Decimal(0),
        isUnlocked: () => applyUpgrade(game.skillTree.upgrades.unlockScrews),

        getScrews: level => new Decimal(2 + Math.floor(level / 100)),

        upgrades:
        {
            fallingScrews: new ScrewUpgrade(
                level => new Decimal(5000 + level * 500),
                level => 2 * level,
                {
                    maxLevel: 10,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
                }),
            higherMoreReinforced: new ScrewUpgrade(
                level => new Decimal(100 + level * 20),
                level => 2 * level,
                {
                    maxLevel: 50,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+", "")
                }),
            fasterBricks: new ScrewUpgrade(
                level => new Decimal(Math.floor(10 * Math.pow(1.027, level + Math.max((level - 99) / 15, 0)))),
                level => 3 * level,
                {
                    maxLevel: 200,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+", "% faster")
                }),
        }
    },
    skillTree:
    {
        isUnlocked: () => game.solarSystem.upgrades.earth.level >= EarthLevels.SKILL_TREE,
        upgrades:
        {
            scrapBoost: new SkillTreeUpgrade(level => Decimal.pow(10, 363 + 21 * level), RESOURCE_SCRAP,
                level => Utils.roundBase(Decimal.pow(24, level), 0),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1),
                    maxLevel: 50
                }),
            xplustwo: new SkillTreeUpgradeFixed([
                [[new Decimal(100000), RESOURCE_FRAGMENT]],
            ], [false, 2], {
                getEffectDisplay: effectDisplayTemplates.unlockEffect("+")
            }, ["scrapBoost"]),
            unlockbeamtypes: new SkillTreeUpgradeFixed([
                [[new Decimal(1000), RESOURCE_BEAM]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["xplustwo"]),
            brickBoost: new SkillTreeUpgradeFixed([
                [[new Decimal("1e666"), RESOURCE_TIRE]],
                [[new Decimal("1e1111"), RESOURCE_TIRE], [new Decimal("1e400"), RESOURCE_SCRAP]],
                [[new Decimal("1e1666"), RESOURCE_TIRE], [new Decimal("1e420"), RESOURCE_SCRAP]],
                [[new Decimal("1e2666"), RESOURCE_TIRE], [new Decimal("1e450"), RESOURCE_SCRAP]],
                [[new Decimal("1e3666"), RESOURCE_TIRE], [new Decimal("1e490"), RESOURCE_SCRAP]],
                [[new Decimal("1e4992"), RESOURCE_TIRE], [new Decimal("1e550"), RESOURCE_SCRAP], [new Decimal("2.424e24"), RESOURCE_GS]]
            ],
                [new Decimal(1), Decimal.pow(2, 127), Decimal.pow(2, 255), Decimal.pow(2, 511), Decimal.pow(2, 1024), Decimal.pow(2, 2048), Decimal.pow(2, 4096)], {
                getEffectDisplay: effectDisplayTemplates.numberStandard(1)
            }, ["unlockbeamtypes"]),
            tireBoost: new SkillTreeUpgradeFixed([
                [[new Decimal("1e2001"), RESOURCE_TIRE], [new Decimal("1e903"), RESOURCE_BRICK]],
                [[new Decimal("1e4002"), RESOURCE_TIRE], [new Decimal("1e1503"), RESOURCE_BRICK]],
                [[new Decimal("1e6003"), RESOURCE_TIRE], [new Decimal("1e2103"), RESOURCE_BRICK]],
                [[new Decimal("1e10002"), RESOURCE_TIRE], [new Decimal("1e4002"), RESOURCE_BRICK]]
            ],
                [new Decimal(1), new Decimal(1.1), new Decimal(1.2), new Decimal(1.3), new Decimal(1.5)], {
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x^")
            }, ["brickBoost"]),
            mergeQuestUpgFallingMagnet: new SkillTreeUpgradeFixed([
                [[new Decimal(20), RESOURCE_MERGE_TOKEN]]
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["unlockbeamtypes"]),
            magnetUpgBrickSpeed: new SkillTreeUpgradeFixed([
                [[new Decimal(1e12), RESOURCE_MAGNET], [new Decimal(25), RESOURCE_MERGE_TOKEN]]
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["mergeQuestUpgFallingMagnet", "brickBoost"]),
            ezUpgraderQuests: new SkillTreeUpgradeFixed([
                [[new Decimal(30), RESOURCE_MERGE_TOKEN]]
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["magnetUpgBrickSpeed"]),
            scrapBoost2: new SkillTreeUpgrade(level => Decimal.pow(10, 600 + 200 * level), RESOURCE_SCRAP,
                level => 1 * Decimal.pow(1000, level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1),
                    maxLevel: 10
                }, ["tireBoost"]),
            moreFragments: new SkillTreeUpgrade(
                level => new Decimal(10 + (2 * level)), RESOURCE_MERGE_TOKEN,

                level => 1 + (level / 5),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1),
                    maxLevel: 45
                }, ["mergeQuestUpgFallingMagnet"]),

            fasterAutoMerge: new SkillTreeUpgradeFixed([
                [[new Decimal(100), RESOURCE_MERGE_TOKEN]],
            ], [false, 50], {
                getEffectDisplay: effectDisplayTemplates.unlockEffect("-", "%")
            }, ["moreFragments"]),

            tireValue: new SkillTreeUpgradeFixed([
                [[new Decimal("1e4002"), RESOURCE_BRICK]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["fasterAutoMerge"]),

            higherAstroMax: new SkillTreeUpgradeFixed([
                [[new Decimal("1e1000"), RESOURCE_SCRAP]],
            ], [false, 25], {
                getEffectDisplay: effectDisplayTemplates.unlockEffect("+")
            }, ["scrapBoost2"]),

            moreMergeTokens: new SkillTreeUpgradeFixed([
                [[new Decimal("3000"), RESOURCE_BEAM]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["higherAstroMax", "tireValue"]),

            unlockScrapyard: new SkillTreeUpgradeFixed([
                [[new Decimal("1e46"), RESOURCE_GS]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["moreMergeTokens"]),

            superEzUpgrader: new SkillTreeUpgradeFixed([
                [[new Decimal(500), RESOURCE_MERGE_TOKEN]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["moreMergeTokens"]),

            higherBeamValueMax: new SkillTreeUpgrade(level => new Decimal("1e24").mul(Math.pow(100, level)), RESOURCE_MAGNET,
                level => level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+", ""),
                    maxLevel: 20,
                    afterBuy: () => { updateBetterBarrels() }
                }, ["superEzUpgrader"]),

            fasterBricks: new SkillTreeUpgrade(level => new Decimal(10000 * (level + 1)), RESOURCE_DARKFRAGMENT,
                level => 1 * level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "+", "%"),
                    maxLevel: 40
                }, ["unlockScrapyard"]),
            speedBoostsFragments: new SkillTreeUpgrade(
                level => new Decimal(300), RESOURCE_GLITCHBEAM,
                level => 1 + (level * 100 * applyUpgrade(game.solarSystem.upgrades.venus) / applyUpgrade(game.scrapUpgrades.fasterBarrels)),
                {
                    maxLevel: 1,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x")
                }, ["higherBeamValueMax", "fasterBricks"]),

            unlockMastery: new SkillTreeUpgradeFixed([
                [[new Decimal(10), RESOURCE_LEGENDARYSCRAP], [new Decimal(1000), RESOURCE_BARREL], [new Decimal(400), RESOURCE_REINFORCEDBEAM]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["speedBoostsFragments"]),

            efficientEnergy: new SkillTreeUpgradeFixed([
                [[new Decimal(15000), RESOURCE_REINFORCEDBEAM], [new Decimal(10000), RESOURCE_MERGE_TOKEN]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["unlockMastery"]),

            renewableEnergy: new SkillTreeUpgradeFixed([
                [[new Decimal(5000), RESOURCE_AEROBEAM], [new Decimal(1e75), RESOURCE_MAGNET]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["efficientEnergy"]),

            fourthMaxLevel: new SkillTreeUpgradeFixed([
                [[new Decimal(2729), RESOURCE_GLITCHBEAM], [new Decimal(1e150), RESOURCE_GS]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["unlockMastery"]),

            unlockBeamConverter: new SkillTreeUpgradeFixed([
                [[new Decimal(1000), RESOURCE_BEAM], [new Decimal(1000), RESOURCE_AEROBEAM], [new Decimal(10000), RESOURCE_ANGELBEAM], [new Decimal(10000), RESOURCE_REINFORCEDBEAM], [new Decimal(1000), RESOURCE_GLITCHBEAM],],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["fourthMaxLevel"]),

            unlockPlasticBags: new SkillTreeUpgradeFixed([
                [[new Decimal(10000), RESOURCE_AEROBEAM], [new Decimal("1e2000"), RESOURCE_SCRAP], [new Decimal(1e15), RESOURCE_FRAGMENT]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock(),
                oneDep: true
            }, ["renewableEnergy", "unlockBeamConverter"]),

            strongerMasteryGS: new SkillTreeUpgrade(
                level => new Decimal(4000 + (2000 * level)), RESOURCE_MERGE_TOKEN,

                level => 1 + level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x^"),
                    maxLevel: 10
                }, ["unlockPlasticBags"]),

            strongerMasteryMagnets: new SkillTreeUpgrade(
                level => new Decimal(7 + level), RESOURCE_STEELMAGNET,

                level => 1 + level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x^"),
                    maxLevel: 10
                }, ["strongerMasteryGS"]),

            fasterMergeMastery: new SkillTreeUpgrade(
                level => new Decimal(1e50).mul(new Decimal(10).pow(level)), RESOURCE_MAGNET,

                level => level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "-", "%"),
                    maxLevel: 1000
                }, ["strongerMasteryMagnets"]),

            shortGSStorms: new SkillTreeUpgradeFixed([
                [[new Decimal(5000), RESOURCE_AEROBEAM], [new Decimal(25), RESOURCE_PLASTICBAG], [new Decimal(3000), RESOURCE_GLITCHBEAM]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["unlockPlasticBags"]),

            higherNeptuneMax: new SkillTreeUpgrade(
                level => new Decimal("1e200000").pow(level + 1), RESOURCE_BRICK,

                level => level * 5,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+"),
                    maxLevel: 6
                }, ["shortGSStorms"]),

            unlockAutoCollectors: new SkillTreeUpgradeFixed([
                [[new Decimal(33284), RESOURCE_GLITCHBEAM], [new Decimal(50), RESOURCE_PLASTICBAG]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["higherNeptuneMax"]),

            tireBoost2: new SkillTreeUpgradeFixed([
                [[new Decimal(10), RESOURCE_PLASTICBAG], [new Decimal(2000), RESOURCE_BEAM]],
                [[new Decimal(20), RESOURCE_PLASTICBAG], [new Decimal(4000), RESOURCE_REINFORCEDBEAM]],
                [[new Decimal(40), RESOURCE_PLASTICBAG], [new Decimal(16000), RESOURCE_ANGELBEAM]],
                [[new Decimal(80), RESOURCE_PLASTICBAG], [new Decimal(3333), RESOURCE_GLITCHBEAM]],
                [[new Decimal(160), RESOURCE_PLASTICBAG], [new Decimal(32000), RESOURCE_AEROBEAM]]
            ],
                [new Decimal(1), new Decimal(1.1), new Decimal(1.3), new Decimal(1.6), new Decimal(2), new Decimal(4)], {
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x^")
            }, ["unlockPlasticBags"]),

            doublePlasticBags: new SkillTreeUpgradeFixed([
                [[new Decimal(15000), RESOURCE_AEROBEAM], [new Decimal(1e24), RESOURCE_DARKSCRAP]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["tireBoost2"]),

            cheaperMythus: new SkillTreeUpgradeFixed([
                [[new Decimal(40), RESOURCE_PLASTICBAG], [new Decimal(41316), RESOURCE_GLITCHBEAM], [new Decimal(5000), RESOURCE_BARREL]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["doublePlasticBags"]),

            unlockScrews: new SkillTreeUpgradeFixed([
                [[new Decimal(100), RESOURCE_PLASTICBAG], [new Decimal("1e200"), RESOURCE_GS], [new Decimal(20000), RESOURCE_REINFORCEDBEAM]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock(),
                oneDep: true
            }, ["fasterMergeMastery", "unlockAutoCollectors", "cheaperMythus"]),

            // Row 1
            magnetBoost: new SkillTreeUpgrade(
                level => new Decimal(1200).mul(level + 1), RESOURCE_SCREW,

                level => new Decimal(16).pow(level),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x"),
                    maxLevel: 50
                }, ["unlockScrews"]),

            newTireUpgrades: new SkillTreeUpgradeFixed([
                [[new Decimal(100000), RESOURCE_REINFORCEDBEAM], [new Decimal(10), RESOURCE_FISHINGNET], [new Decimal("1e1000000"), RESOURCE_TIRE]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["unlockScrews"]),

            posusAffectsDark: new SkillTreeUpgradeFixed([
                [[new Decimal(20000), RESOURCE_SCREW], [new Decimal(1e6), RESOURCE_DARKFRAGMENT], [new Decimal(10000), RESOURCE_BEAM]],
            ], [false, 0.5], {
                getEffectDisplay: effectDisplayTemplates.unlockEffect("^")
            }, ["unlockScrews"]),

            // Row 2
            fallingMagnetValue: new SkillTreeUpgradeFixed([
                [[new Decimal("1e150"), RESOURCE_MAGNET], [new Decimal(10), RESOURCE_BUCKET], [new Decimal(5000), RESOURCE_MERGE_TOKEN]],
            ], [1, 100], {
                getEffectDisplay: effectDisplayTemplates.unlockEffect("x")
            }, ["magnetBoost"]),

            unlockTimeMode: new SkillTreeUpgradeFixed([
                [[new Decimal("1e250"), RESOURCE_GS], [new Decimal(30000), RESOURCE_MERGE_TOKEN], [new Decimal(6791), RESOURCE_GLITCHBEAM]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["newTireUpgrades"]),

            starDaily: new SkillTreeUpgradeFixed([
                [[new Decimal(10), RESOURCE_LEGENDARYSCRAP], [new Decimal(10000), RESOURCE_BARREL]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["posusAffectsDark"]),

            // Row 3
            veryFastCrafting: new SkillTreeUpgradeFixed([
                [[new Decimal("1e250"), RESOURCE_GS], [new Decimal(1000), RESOURCE_MASTERYTOKEN], [new Decimal(25000), RESOURCE_AEROBEAM], [new Decimal(1000), RESOURCE_WRENCH]],
                [[new Decimal("1e300"), RESOURCE_GS], [new Decimal(25), RESOURCE_LEGENDARYSCRAP], [new Decimal(10000), RESOURCE_BEAM], [new Decimal(200), RESOURCE_WRENCH]],
                    [[new Decimal("1e400"), RESOURCE_GS], [new Decimal(25), RESOURCE_FISHINGNET], [new Decimal(25), RESOURCE_PLASTICBAG]],
                    [[new Decimal("1e750"), RESOURCE_GS], [new Decimal("1e120"), RESOURCE_DARKSCRAP], [new Decimal(250000), RESOURCE_REINFORCEDBEAM]]
            ], [1, 2, 3, 4, 8], {
                getEffectDisplay: effectDisplayTemplates.unlockEffect("x")
            }, ["fallingMagnetValue"]),

            funnyGlitchBeams: new SkillTreeUpgradeFixed([
                [[new Decimal(10000), RESOURCE_REINFORCEDBEAM], [new Decimal(10), RESOURCE_BUCKET], [new Decimal(25), RESOURCE_BLUEBRICK]],
            ], [false, true], {
                getEffectDisplay: effectDisplayTemplates.unlock()
            }, ["unlockTimeMode"]),

            higherDarkScrapTokenMax: new SkillTreeUpgrade(
                level => new Decimal(1200).mul(level + 1), RESOURCE_BARREL,

                level => 10 * level,
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "+"),
                    maxLevel: 14
                }, ["starDaily"]),
        }
    },
    barrelMastery: {
        isUnlocked: () => applyUpgrade(game.skillTree.upgrades.unlockMastery),
        b: [], // All ya merges
        bl: [], // All ya levels
        levels: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
        masteryTokens: new Decimal(0),
        upgrades:
        {
            scrapBoost: new MasteryTokenUpgrade(
                level => new Decimal(Math.round(2 * Math.max(1, (level / 2) - 5))),
                level => new Decimal(1 + (0.05 * level)),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x", "^L1")
                }),
            goldenScrapBoost: new MasteryTokenUpgrade(
                level => new Decimal(Math.round(2 * Math.max(1, (level / 2) - 5))),
                level => new Decimal(1 + (0.0015 * level)),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x", "^L2")
                }),
            brickBoost: new MasteryTokenUpgrade(
                level => new Decimal(Math.round(2 * Math.max(1, (level / 2) - 5))),
                level => new Decimal(1).mul(new Decimal(16).pow(level + Math.max(0, level - 100))),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(1, "x", "^L3")
                }),
            fragmentBoost: new MasteryTokenUpgrade(
                level => new Decimal(Math.round(2 * Math.max(1, (level / 2) - 5))),
                level => new Decimal(1 + (0.0003 * level)),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(5, "x", "^L4")
                }),
            magnetBoost: new MasteryTokenUpgrade(
                level => new Decimal(Math.round(2 * Math.max(1, (level / 2) - 5))),
                level => new Decimal(1 + (0.001 * level)),
                {
                    getEffectDisplay: effectDisplayTemplates.numberStandard(3, "x", "^L5")
                }),
        }
    },
    shrine: {
        factoryUnlock: new SkillTreeUpgradeFixed([
            [[new Decimal("2000"), RESOURCE_BEAM]],
            [[new Decimal("2000"), RESOURCE_AEROBEAM]],
            [[new Decimal("2000"), RESOURCE_ANGELBEAM]],
            [[new Decimal("2000"), RESOURCE_REINFORCEDBEAM]],
            [[new Decimal("2000"), RESOURCE_GLITCHBEAM]],
        ],
            [false, false, false, false, false, true], {
            getEffectDisplay: effectDisplayTemplates.unlock()
        }, ["unlockbeamtypes"]),

        generatorUnlock: new SkillTreeUpgradeFixed([
            [[new Decimal("1e50"), RESOURCE_MAGNET]],
            [[new Decimal("1e12"), RESOURCE_DARKSCRAP]],
            [[new Decimal("2000"), RESOURCE_GLITCHBEAM]],
        ],
            [false, false, false, true], {
            getEffectDisplay: effectDisplayTemplates.unlock()
        }, ["unlockbeamtypes"]),

        autosUnlock: new SkillTreeUpgradeFixed([
            [[new Decimal("10"), RESOURCE_LEGENDARYSCRAP]],
            [[new Decimal("1e60"), RESOURCE_MAGNET]],
            [[new Decimal("2000"), RESOURCE_REINFORCEDBEAM]],
        ],
            [false, false, false, true], {
            getEffectDisplay: effectDisplayTemplates.unlock()
        }, ["unlockbeamtypes"]),
    },
    factory: {
        tank: new Decimal(0),
        //tankSize: 60,
        time: 0,

        legendaryScrap: new Decimal(0),
        steelMagnets: new Decimal(0),
        blueBricks: new Decimal(0),
        buckets: new Decimal(0),
        fishingNets: new Decimal(0),

        upgrades:
        {
            legendaryScrap: new FactoryUpgrade(
                level => new Decimal(10),
                level => 1,
                {
                    getEffectDisplay: () => "+1 Legendary Scrap\n-10 Energy",
                    onBuy: () => {
                        game.factory.time = 5 * craftingMulti();
                        game.factory.legendaryScrap = game.factory.legendaryScrap.add(1);
                        game.stats.totallegendaryscrap = game.stats.totallegendaryscrap.add(1);
                    }
                }, level => [[new Decimal(1e25).pow(1 + level).mul(new Decimal(1e25).pow(Math.max(1, level - 49))).mul(new Decimal(1e25).pow(Math.max(1, level - 199))), RESOURCE_SCRAP], [new Decimal(1e6).mul(Math.pow(1.3, level)), RESOURCE_DARKSCRAP]]),
            steelMagnets: new FactoryUpgrade(
                level => new Decimal(20),
                level => 1,
                {
                    getEffectDisplay: () => "+1 Steel Magnet\n-20 Energy",
                    onBuy: () => {
                        game.factory.time = 10 * craftingMulti();
                        game.factory.steelMagnets = game.factory.steelMagnets.add(1);
                        game.stats.totalsteelmagnets = game.stats.totalsteelmagnets.add(1);
                    }
                }, level => [[new Decimal(1000000).mul(new Decimal(100).pow(level)), RESOURCE_MAGNET], [new Decimal(100), RESOURCE_BEAM]]),
            blueBricks: new FactoryUpgrade(
                level => new Decimal(15),
                level => 1,
                {
                    getEffectDisplay: () => "+1 Blue Brick\n-15 Energy",
                    onBuy: () => {
                        game.factory.time = 45 * craftingMulti();
                        game.factory.blueBricks = game.factory.blueBricks.add(1);
                        game.stats.totalbluebricks = game.stats.totalbluebricks.add(1);
                    }
                }, level => [[new Decimal("1e10000").mul(new Decimal("1e1000").pow(level * Math.min(10 + Math.max(0, level - 49), Math.max(1, level - 14)))), RESOURCE_BRICK], [new Decimal(75), RESOURCE_AEROBEAM]]),
            buckets: new FactoryUpgrade(
                level => new Decimal(30),
                level => 1,
                {
                    getEffectDisplay: () => "+1 Bucket\n-30 Energy",
                    onBuy: () => {
                        game.factory.time = 30 * craftingMulti();
                        game.factory.buckets = game.factory.buckets.add(1);
                        game.stats.totalbuckets = game.stats.totalbuckets.add(1);
                    }
                }, level => [[new Decimal(1e90).mul(new Decimal(25).pow(level)), RESOURCE_GS], [new Decimal(500), RESOURCE_ANGELBEAM]]),
            fishingNets: new FactoryUpgrade(
                level => new Decimal(60),
                level => 1,
                {
                    getEffectDisplay: () => "+1 Fishing Net\n-60 Energy",
                    onBuy: () => {
                        game.factory.time = 60 * craftingMulti();
                        game.factory.fishingNets = game.factory.fishingNets.add(1);
                        game.stats.totalfishingnets = game.stats.totalfishingnets.add(1);
                    }
                }, level => [[new Decimal(1 + Math.floor(level / 100)), RESOURCE_PLASTICBAG], [new Decimal(300), RESOURCE_REINFORCEDBEAM]]),
        },
    },
    autos:
    {
        autoBetterBarrels: new AutoUpgrade(
            level => new Decimal(Math.round(level / 60) + 2),
            level => (60.5 - (0.5 * level) - (0.25 * Math.min(level, 25)) + (0.25 * Math.max(level - 92, 0))) * Math.min(level, 1),
            RESOURCE_LEGENDARYSCRAP, ["scrapUpgrades", "betterBarrels"],
            time = 0,
            {
                maxLevel: 117,
                getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "s")
            }),
        autoFasterBarrels: new AutoUpgrade(
            level => new Decimal(2),
            level => (62 - (2 * level) - (1 * Math.min(level, 9)) + (1.5 * Math.max(level - 24, 0))) * Math.min(level, 1),
            RESOURCE_LEGENDARYSCRAP, ["scrapUpgrades", "fasterBarrels"],
            time = 0,
            {
                maxLevel: 30,
                getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "s")
            }),
        autoScrapBoost: new AutoUpgrade(
            level => new Decimal(Math.round(level / 4) + 3),
            level => (64 - (4 * level) - (3 * Math.min(level, 4)) + (3 * Math.max(level - 11, 0))) * Math.min(level, 1),
            RESOURCE_STEELMAGNET, ["magnetUpgrades", "scrapBoost"],
            time = 0,
            {
                maxLevel: 15,
                getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "s")
            }),
        autoMoreGoldenScrap: new AutoUpgrade(
            level => new Decimal(Math.round(level / 6) + 2),
            level => (64 - (4 * level) - (3 * Math.min(level, 4)) + (3 * Math.max(level - 11, 0))) * Math.min(level, 1),
            RESOURCE_STEELMAGNET, ["magnetUpgrades", "moreGoldenScrap"],
            time = 0,
            {
                maxLevel: 15,
                getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "s")
            }),
        autoBrickUpgrades: new AutoUpgrade(
            level => new Decimal(3),
            level => (154 - (6 * level) - (4 * Math.min(level, 5)) + (4 * Math.max(level - 20, 0))) * Math.min(level, 1),
            RESOURCE_BLUEBRICK, ["bricks", "all"],
            time = 0,
            {
                maxLevel: 25,
                getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "s")
            }),
        autoGetMoreMagnets: new AutoUpgrade(
            level => new Decimal(1).add(Math.floor(level / 12)),
            level => (305 - (2 * level) - (3 * Math.min(level, 24)) + (1 * Math.max(level - 110, 0))) * Math.min(level, 1),
            RESOURCE_BLUEBRICK, ["goldenScrap", "upgrades", "magnetBoost"],
            time = 0,
            {
                maxLevel: 120,
                getEffectDisplay: effectDisplayTemplates.numberStandard(2, "", "s")
            }),
    },
    collectors: {
        beams: new AutoUpgrade(
            level => new Decimal(3 + Math.floor(level / 7)),
            level => level,
            RESOURCE_FISHINGNET, "beams",
            time = "b",
            {
                maxLevel: 25,
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
            }),
        aerobeams: new AutoUpgrade(
            level => new Decimal(6 + Math.floor(level / 3)),
            level => level,
            RESOURCE_FISHINGNET, "aerobeams",
            time = "b",
            {
                maxLevel: 25,
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
            }),
        angelbeams: new AutoUpgrade(
            level => new Decimal(2 + Math.floor(level / 10)),
            level => level,
            RESOURCE_FISHINGNET, "angelbeams",
            time = "b",
            {
                maxLevel: 25,
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
            }),
        reinforcedbeams: new AutoUpgrade(
            level => new Decimal(10 + Math.floor(level / 5)),
            level => level,
            RESOURCE_FISHINGNET, "reinforcedbeams",
            time = "b",
            {
                maxLevel: 25,
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
            }),
        glitchbeams: new AutoUpgrade(
            level => new Decimal(10 + Math.floor(level / 5)),
            level => level,
            RESOURCE_FISHINGNET, "glitchbeams",
            time = "b",
            {
                maxLevel: 25,
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
            }),
        tires: new AutoUpgrade(
            level => new Decimal(5 + Math.floor(level / 5)),
            level => level,
            RESOURCE_BUCKET, "tires",
            time = "b",
            {
                maxLevel: 75,
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
            }),
        gold: new AutoUpgrade(
            level => new Decimal(2 + Math.floor(level / 8)),
            level => level,
            RESOURCE_BUCKET, "gold",
            time = "b",
            {
                maxLevel: 25,
                getEffectDisplay: effectDisplayTemplates.numberStandard(1, "", "%")
            }),
    },
    milestones:
    {
        achievements:
            [
                new Milestone(1, "Noob", 1, "Reach 1,000 Scrap", () => game.highestScrapReached.gte(1000)),
                new Milestone(2, "Magnet", 2, "Get your first Magnet", () => game.magnets.gte(1)),
                new Milestone(3, "OMG so rich", 1, "Reach 1,000,000,000 Scrap", () => game.highestScrapReached.gte(1000000000)),
                new Milestone(4, "Time to Retire!", 4, () => "Reach " + formatNumber(1e15) + " Scrap to be able to\nReset to get Golden Scrap.\nEach Golden Scrap Boosts Scrap\nProduction by 1%.", () => game.highestScrapReached.gte(1e15), "#ffff00"),
                new Milestone(5, "First Boosts", 3, "Buy your first Magnet Upgrade", () => Utils.filterObject(game.magnetUpgrades, upg => upg.level > 0).length > 0),
                new Milestone(6, "Doubled Scrap", 5, "Reach 100 Golden Scrap", () => game.goldenScrap.amount.gte(100)),
                new Milestone(7, "More Upgrades!", 58, "Buy your first \nGolden Scrap Upgrade", () => Utils.filterObject(game.goldenScrap.upgrades, upg => upg.level > 0).length > 0, "#b7b772"),
                new Milestone(8, "Automation", 6, "Reach " + formatThousands(1000) + " Golden Scrap to\nunlock auto-merging", () => game.goldenScrap.amount.gte(1000)),
                new Milestone(9, "Septillionaire", 7, () => "Reach " + formatNumber(1e24) + " Scrap", () => game.highestScrapReached.gte(1e24)),
                new Milestone(10, "Double Magnet", 59, "Get 2 Magnets each time you Merge", () => getMagnetBaseValue()
                    .gte(2)),
                new Milestone(11, "Apollo 21", 49, "Reach Level 8 on the \"More Scrap\"\nGolden Scrap Upgrade to\nexplore the Solar System!", () => game.goldenScrap.upgrades.scrapBoost.level >= 8, "#b0b0b0"),
                new Milestone(12, "Magnetism", 2, () => "Have " + formatNumber(1000) + " Magnets at once", () => game.magnets.gte(1000)),
                new Milestone(13, "BIG Scrap", 9, "Upgrade the Sun once", () => game.solarSystem.upgrades.sun.level > 0),
                new Milestone(14, "Palace of Gold", 12, "Reach 1,000,000 Golden Scrap", () => game.goldenScrap.amount.gte(1e6)),
                new Milestone(15, "AM go brrrrrr", 28, "Barrels spawn faster than 500ms", () => applyUpgrade(game.scrapUpgrades.fasterBarrels).toNumber() < 0.5, "#00ffff"),
                new Milestone(16, "It's musically", 37, "Enable music", () => game.settings.musicOnOff == 1),
                new Milestone(17, "So I can read my scrap", 38, "Switch to scientific notation", () => game.settings.numberFormatType == 3),
                new Milestone(18, "Yeah, but it's 5 mil", 12, "Reach 5,000,000 Golden Scrap", () => game.goldenScrap.amount.gte(5e6)),
                new Milestone(19, "Magnets & Mayonnaise", 2, () => "Have " + formatNumber(10000) + " Magnets at once", () => game.magnets.gte(10000)),
                new Milestone(20, "Just a few", 11, "Upgrade the sun a few times", () => game.solarSystem.upgrades.sun.level >= 100),
                new Milestone(21, "DESTROY THEM!!!", 1, "Enable destroying barrels", () => game.settings.destroyBarrels == 1),
                new Milestone(22, "The fanmade currency!", 39, "Reach barrel 100 to unlock Barrel Fragments!", () => game.fragment.isUnlocked()),
                new Milestone(23, "Mags sponsored by Frags", 8, "Buy a level of More Magnets (Fragment upgrade)", () => game.fragment.upgrades.magnetBoost.level > 0),
                new Milestone(24, "One K of F", 48, "Have 1000 fragments at once", () => game.fragment.amount.gte(1000)),
                new Milestone(121, "Where am I?", 73, () => "Use the barrel search to search\nfor your current spawning barrel", () => game.dimension == 508050),
                new Milestone(25, "4Posupgs", 50, "Have 10000 fragments at once", () => game.fragment.amount.gte(10000)),
                new Milestone(26, "Who needs\nUpgrades", 13, () => "Get " + formatNumber(1e15) + " Scrap without\nbuying Scrap Upgrades", () => game.scrap.gte(1e15) && game.scrapUpgrades.betterBarrels.level === 0 && game.scrapUpgrades.fasterBarrels.level === 0),
                new Milestone(27, "M.P. + W2ed", 8, "Have 69.420 magnets at once", () => game.magnets.gte(69420)),
                new Milestone(28, "RPG", 14, () => "Reach " + formatNumber(1e93) + " Scrap to\nunlock Merge Quests!", () => game.highestScrapReached.gte(1e93), "#5edc00"),
                new Milestone(29, "Best Barrels", 10, "Reach Better Barrels Upgrade Level 200", () => game.scrapUpgrades.betterBarrels.level >= 200),
                new Milestone(30, "Apollo 23", 15, "Unlock Mars by upgrading Earth!", () => game.solarSystem.upgrades.earth.level >= EarthLevels.UNLOCK_MARS, "#a0a0a0"),
                new Milestone(31, "Reinforcements", 16, () => "Reach " + formatNumber(1e153) + " Scrap to\nunlock Merge Mastery!", () => game.highestScrapReached.gte(1e153), "#00e8e4"),
                new Milestone(32, "Speed of Sound", 28, "Barrels spawn faster than 250ms", () => applyUpgrade(game.scrapUpgrades.fasterBarrels).toNumber() < 0.25, "#00ffff"),
                new Milestone(33, "Merge Again", 17, "Prestige Merge Mastery", () => game.mergeMastery.prestige.level > 0),
                new Milestone(91, "Steel Beams!", 47, () => "Unlock Steel Beams by reaching barrel 300", () => game.highestBarrelReached > 299),
                new Milestone(34, "Questing to\nthe Max", 14, "Have all Merge Quest\nUpgrades at least at Level 20", () => Utils.filterObject(game.mergeQuests.upgrades, upg => upg.level >= 20).length === 3),
                new Milestone(35, "Interesting Barrels", 10, "Reach Better Barrels Level 300", () => game.scrapUpgrades.betterBarrels.level >= 300),
                new Milestone(106, "Almost there!", 65, "Do 10k self merges\n(Merges from auto merge do not count as self merges)", () => game.selfMerges > 9999),
                new Milestone(107, "The worst currency", 66, "Unlock wrenches (12k self merges)", () => game.wrenches.isUnlocked()),
                new Milestone(36, "Who needs\nUpgrades II", 13, () => "Get " + formatNumber(1e30) + " Scrap without\nbuying Scrap Upgrades", () => game.scrap.gte(1e30) && game.scrapUpgrades.betterBarrels.level === 0 && game.scrapUpgrades.fasterBarrels.level === 0),
                new Milestone(37, "Magnetism II", 2, () => "Have " + formatThousands(10e6) + " Magnets at once", () => game.magnets.gte(10e6)),
                new Milestone(108, "Better than the dev", 66, "Have more than 5292 wrenches at once", () => game.wrenches.amount > 5292),
                new Milestone(38, "Building\nBlocks", 18, () => "Reach " + formatNumber(1e213) + " Scrap to\nunlock Bricks!", () => game.highestScrapReached.gte(1e213), "#feb329"),
                new Milestone(39, "Overproductive\nStart", 21, () => "First Barrel produces more than " + formatNumber(1e63) + " Scrap", () => Barrel.getIncomeForLevel(0).gte(1e63)),
                new Milestone(40, "HUGE Scrap", 11, () => "Upgrade the Sun to Level 1000\n(Currently: " + game.solarSystem.upgrades.sun.level.toFixed(0) + ")", () => game.solarSystem.upgrades.sun.level >= 1000),
                new Milestone(92, "Hey there my good old friend!", 47, () => "Catch your first Steel Beam", () => game.beams.amount > 0),
                new Milestone(41, "Who needs\nUpgrades III", 13, () => "Get " + formatNumber(1e90) + " Scrap without\nbuying Scrap Upgrades", () => game.scrap.gte(1e90) && game.scrapUpgrades.betterBarrels.level === 0 && game.scrapUpgrades.fasterBarrels.level === 0),
                new Milestone(42, "Infinity", 19, () => "Reach " + formatNumber(Decimal.pow(2, 1024)) + " Scrap", () => game.highestScrapReached.gte(Decimal.pow(2, 1024)), "red"),
                new Milestone(43, "100%", 20, "Upgrade Mercury to Level 99", () => game.solarSystem.upgrades.mercury.level >= 99),
                new Milestone(44, "Millions\nat once", 22, () => "Get " + formatThousands(1e6) + " Magnets per Merge", () => getMagnetBaseValue()
                    .gte(1e6)),
                new Milestone(45, "Mega Mastery", 16, "Reach Merge Mastery Level 150", () => game.highestMasteryLevel >= 150),
                new Milestone(93, "I steal beans", 52, () => "Hoard quite some Steel Beams", () => game.beams.amount > 99),
                new Milestone(46, "Tire", 26, "Get your first Tire\nReach Barrel 500 to unlock Tires", () => game.tires.amount.gt(0), "#00e57e"),
                new Milestone(47, "It is\npossible", 24, () => "Reach " + formatNumber(new Decimal("1e500")) + " Bricks", () => game.bricks.amount.gte(new Decimal("1e500"))),
                new Milestone(95, "Worth a LOT", 54, () => "Increase the beam worth to 5", () => game.beams.upgrades.beamValue.level > 3),
                new Milestone(119, "Ski", 72, () => "Ski", () => game.highestBarrelReached >= 553),
                new Milestone(48, "COLOSSAL Scrap", 11, () => "Upgrade the Sun to Level 5000\n(Currently: " + game.solarSystem.upgrades.sun.level.toFixed(0) + ")", () => game.solarSystem.upgrades.sun.level >= 5000),
                new Milestone(94, "Bee-ms", 53, () => "Increase the beam frequency a bit", () => game.beams.upgrades.fasterBeams.level > 3),
                new Milestone(49, "RPG v2", 32, "Unlock the Skill Tree by upgrading Earth", () => game.skillTree.isUnlocked(), "#98ff00"),
                new Milestone(50, "Apollo 99", 31, "Unlock the whole Solar System", () => game.solarSystem.upgrades.earth.level >= EarthLevels.UNLOCK_NEPTUNE, "#909090"),
                new Milestone(51, "Ultra Mastery", 16, "Reach Merge Mastery Level 300", () => game.highestMasteryLevel >= 300, "#e0e0e0"),
                new Milestone(52, "The Secret Upgrade", 34, "Unlock a new Upgrade...", () => game.skillTree.upgrades.mergeQuestUpgFallingMagnet.isUnlocked()),
                new Milestone(101, "AERODYNAMIC!", 60, () => "Catch an aerobeam (unlocked with a tree upgrade)", () => game.aerobeams.amount > 0),
                new Milestone(53, "Evolution\nof Tires", 27, "Unlock all Tire Upgrades", () => game.tires.amount.gte(game.tires.milestones[2])),
                new Milestone(54, "Speed\nof Light", 28, "Auto Merger is faster than 0.25s", () => applyUpgrade(game.solarSystem.upgrades.saturn)
                    .lte(0.25), "#00d7ff"),
                new Milestone(55, "Double every Dozen", 35, "Double Brick production every 12 Merges", () => game.bricks.mergesPerLevel() <= 12 || game.reinforcedbeams.upgrades.reinforcedbricks.level > 4),
                new Milestone(102, "Nonstop Aero", 61, () => "Max. aerobeam frequency", () => game.aerobeams.upgrades.fasterBeams.level == 30),
                new Milestone(56, "Very EZ", 33, "Unlock the EZ Upgrader\nand do Merge Quests\nmore easily", () => applyUpgrade(game.skillTree.upgrades.ezUpgraderQuests)),
                new Milestone(57, "It is indeed\npossible", 25, () => "Reach " + formatNumber(new Decimal("1e5000")) + " Tires", () => game.tires.amount.gte(new Decimal("1e5000"))),
                new Milestone(96, "500m³ of beams", 55, () => "Increase the storm value to the max.", () => game.beams.upgrades.beamStormValue.level == 5),
                new Milestone(58, "Is this even\npossible??", 23, () => "Have " + formatThousands(1e15) + " Magnets at once", () => game.magnets.gte(1e15)),
                new Milestone(103, "Magnet Man get Sixpack", 62, () => "Triple the falling magnet value!", () => game.aerobeams.upgrades.betterFallingMagnets.level > 19),
                new Milestone(59, "Best Barrels III", 10, "Reach Better Barrels Upgrade Level 1000", () => game.scrapUpgrades.betterBarrels.level >= 1000),
                new Milestone(60, "Warp 9.9", 28, "Barrels spawn faster than 5ms", () => applyUpgrade(game.scrapUpgrades.fasterBarrels).toNumber() < 0.005, "#0092ff"),
                new Milestone(61, "Going for Frank's record", 39, "Have 1e6 fragments at once", () => game.fragment.amount.gte(999999)),
                new Milestone(100, "Great Northern Beans", 52, () => "Hoard quite many Steel Beams", () => game.beams.amount > 499),
                new Milestone(62, "Best Barrels IV", 10, "Reach Better Barrels Upgrade Level 2000", () => game.scrapUpgrades.betterBarrels.level >= 2000),
                new Milestone(97, "Beam Thunder", 56, () => "Increase the storm chance to 5%", () => game.beams.upgrades.beamStormChance.level > 49),
                new Milestone(63, "Master Mastery", 16, "Reach Merge Mastery Level 500", () => game.highestMasteryLevel >= 500, "#e0e0e0"),
                new Milestone(64, "TABLE SMASH!!!", 25, () => "Reach " + formatNumber(new Decimal("1e10000")) + " Tires", () => game.tires.amount.gte(new Decimal("1e10000"))),
                new Milestone(65, "Best Barrels V", 10, "Reach Better Barrels Upgrade Level 3000", () => game.scrapUpgrades.betterBarrels.level >= 3000),
                new Milestone(66, "Need more\nInfinities", 30, () => "First Barrel produces more than " + formatNumber(Decimal.pow(2, 1024)) + " Scrap", () => Barrel.getIncomeForLevel(0)
                    .gte(Decimal.pow(2, 1024))),
                new Milestone(111, "Believe in Beams", 70, () => "Catch an Angel Beam (unlocked by upgrading Earth and Skill Tree)", () => game.angelbeams.amount > 0),
                new Milestone(112, "So many! I can't believe it!", 70, () => "Every Angel Beam is worth 21", () => game.angelbeams.upgrades.beamValue.level > 19),
                new Milestone(71, "Second Dimension", 42, () => "Unlock the Second Dimension", () => game.solarSystem.upgrades.earth.level >= EarthLevels.SECOND_DIMENSION),
                new Milestone(72, "I'm scared", 42, () => "Enter the Second Dimension", () => game.dimension == 1),
                new Milestone(98, "Beam Hailstorm", 57, () => "Increase the storm chance to 10%", () => game.beams.upgrades.beamStormChance.level > 99),
                new Milestone(73, "Back on earth", 1, () => "Leave the Second Dimension", () => game.darkscrap.amount > 1),
                new Milestone(74, "Dark money???", 40, () => "Earn some dark scrap", () => game.darkscrap.amount > 24),
                new Milestone(75, "Fragments from the\n other side", 41, () => "Earn your first dark fragments", () => game.darkfragment.amount > 1),
                new Milestone(114, "Magnet Storms?", 23, () => "Unlock a new storm type", () => game.aerobeams.upgrades.unlockGoldenScrapStorms.level > 0),
                new Milestone(67, "Need more\nInfinities II", 30, () => "First Barrel produces more than " + formatNumber(Decimal.pow(4, 1024)) + " Scrap", () => Barrel.getIncomeForLevel(0)
                    .gte(Decimal.pow(4, 1024))),
                new Milestone(76, "it so slow.", 40, () => "Earn 1000 dark scrap", () => game.darkscrap.amount > 999),
                new Milestone(77, "I like Pain", 40, () => "Earn 100k dark scrap", () => game.darkscrap.amount > 99999),
                new Milestone(78, "They're like fragments,", 41, () => "Earn 100 dark fragments", () => game.darkfragment.amount > 99),
                new Milestone(79, "but cooler", 41, () => "Earn 10k dark fragments", () => game.darkfragment.amount > 9999),
                new Milestone(123, "The mythical planet", 74, () => "Mythus level 10", () => game.solarSystem.upgrades.mythus.level > 9),
                new Milestone(80, "Double Tap Double Pain", 41, () => "Earn 100k dark fragments", () => game.darkfragment.amount > 99999),
                new Milestone(109, "But it doesn't cost scrap!", 67, "Unlock the scrapyard", () => game.skillTree.upgrades.unlockScrapyard.level > 0),
                new Milestone(116, "No storm :(", 22, () => "Increase storm chance to max.", () => game.angelbeams.upgrades.goldenScrapStormChance.level > 37),
                new Milestone(68, "Need more\nInfinities III", 30, () => "First Barrel produces more than " + formatNumber(Decimal.pow(8, 1024)) + " Scrap", () => Barrel.getIncomeForLevel(0)
                    .gte(Decimal.pow(8, 1024))),
                new Milestone(81, "New Dark", 51, () => "Reach Better Barrels 300 in the Second Dimension", () => game.dimension == 1 && game.scrapUpgrades.betterBarrels.level >= 300),
                new Milestone(126, "Steel", 76, () => "Collect your first Reinforced Beam!\nUnlocked by reaching Merge Mastery level 300", () => game.reinforcedbeams.amount > 0),
                new Milestone(82, "I've seen them all", 51, () => "Reach Better Barrels 600 in the Second Dimension", () => game.dimension == 1 && game.scrapUpgrades.betterBarrels.level >= 600),
                new Milestone(83, "MaxProd3000", 40, () => "Level the first Dark Scrap upgrade to level 50", () => game.darkscrap.upgrades.darkScrapBoost.level > 49),
                new Milestone(84, "Quests, I hate em", 14, () => "Max. the second Dark Scrap upgrade", () => game.darkscrap.upgrades.mergeTokenBoost.level > 49),
                new Milestone(128, "Reinforce", 76, () => "Level the first Reinforced Beams upgrade to level 10", () => game.reinforcedbeams.upgrades.reinforce.level > 9),
                new Milestone(85, "I love Pain", 42, () => "Earn 1,000,000 dark scrap or dark fragments", () => game.darkfragment.amount > 999999 || game.darkscrap.amount > 999999),
                new Milestone(127, "Reinforced Amount", 76, () => "Have 300 Reinforced Beams at once", () => game.reinforcedbeams.amount > 300),
                new Milestone(69, "Are we\nthere yet?", 29, () => "Reach " + formatNumber(Decimal.pow(9.999, 1000)) + " Scrap", () => game.highestScrapReached.gte(Decimal.pow(9.999, 1000)), "red"),
                new Milestone(113, "I like to call it cloning", 27, () => "Spawn a tire by collecting a tire!", () => game.dimension == 508050),
                new Milestone(118, "Sponsored by Angel Beams", 4, () => "Reach " + formatNumber(new Decimal(1e60)) + " Golden Scrap", () => game.goldenScrap.amount.gte(1e60)),
                new Milestone(70, "Inf.^10", 36, () => "Reach " + formatNumber(Decimal.pow(2, 10240)) + " Scrap", () => game.highestScrapReached.gte(Decimal.pow(2, 10240)), "#b60045"),
                new Milestone(99, "Slow, slow, slow", 47, () => "Make beams much slower", () => game.beams.upgrades.slowerBeams.level > 24),
                new Milestone(129, "Build a house", 76, () => "Level the first Reinforced Beams upgrade to level 40", () => game.reinforcedbeams.upgrades.reinforce.level > 39),
                new Milestone(122, "Champion", 0, () => "100 Achievements", () => game.ms.length > 99),
                new Milestone(104, "Master Mastery II", 16, "Reach Merge Mastery Level 1000", () => game.highestMasteryLevel >= 1000),
                new Milestone(164, "yes", 50, "no", () => game.settings.numberFormatType == 11),
                new Milestone(131, "Balanced and fair", 76, () => "Keep the balance", () => game.reinforcedbeams.upgrades.reinforce.level > 19 && game.reinforcedbeams.upgrades.strength.level * 2 > game.reinforcedbeams.upgrades.reinforce.level - 3),
                new Milestone(135, "Very, very EZ", 33, "Unlock the Super EZ Upgrader in the Skill Tree!", () => applyUpgrade(game.skillTree.upgrades.superEzUpgrader)),
                new Milestone(86, "1 to 10 in Order", 1, () => "Put the first ten barrels (without stars) in order,\nBarrel 1 in pos 1 (top left), 2 in 2, etc.\nThen upgrade Better Barrels when they are placed correctly.", () => game.dimension == 508050),
                new Milestone(87, "Shrove Supremacy", 43, () => "Merge 10k barrels while Shrove\nis your spawning barrel", () => game.dimension == 508050),
                new Milestone(88, "A whole field of 69", 44, () => "Make a 6 out of barrels, uprade\nBetter Barrels, make a 9\n and upgrade again to get this.", () => game.dimension == 508050),
                new Milestone(89, "Pastaring", 45, () => "Put the first pasta barrel in the top left.\nSecond pasta barrel in the top right.\nThen upgrade Better Barrels to confirm.", () => game.dimension == 508050),
                new Milestone(90, "Tire at top, in my hand", 46, () => "Collect a tire while having a stack of tires in the top left", () => game.dimension == 508050),
                new Milestone(134, "Almost legendary scrap", 4, () => "Reach " + formatNumber(new Decimal(1e80)) + " Golden Scrap", () => game.goldenScrap.amount.gte(1e80)),
                new Milestone(110, "Double Speed (v5 Style Pizza)", 68, "Upgrade scrapyard to level 101", () => game.mergeQuests.scrapyard > 100),
                new Milestone(130, "Heavy Metal", 76, () => "Max. the first Reinforced Beams upgrade", () => game.reinforcedbeams.upgrades.reinforce.level > 98),
                new Milestone(115, "The most and brightest", 71, () => "Every Angel Beam is worth 100", () => game.angelbeams.upgrades.beamValue.level > 98),
                new Milestone(105, "EXILE", 64, "Reach Merge Mastery Level 2000", () => game.highestMasteryLevel >= 2000),
                new Milestone(132, "Critical hit!", 77, () => "Collect a Reinforced Beam 3x faster", () => game.dimension == 508050),
                new Milestone(133, "Slower but stronger", 78, () => "Reinforce your bricks", () => game.reinforcedbeams.upgrades.reinforcedbricks.level > 0),
                new Milestone(136, "Buggy game", 79, "Gather enough dark scrap and select\nthe right beam type to find glitches...\nand collect one", () => game.glitchesCollected > 0),
                new Milestone(137, "Broken game", 79, "Collect 6 glitches", () => game.glitchesCollected > 5),
                new Milestone(138, "Where did he go?", 80, "Collect a Glitch Beam (Unlocked by collecting enough glitches)", () => game.glitchbeams.amount.gte(1)),
                new Milestone(139, "What the...?", 83, "Unlock the Scrap Factory", () => game.solarSystem.upgrades.earth.level >= EarthLevels.SCRAP_FACTORY),
                new Milestone(140, "Pay the bills?", 84, "Unlock the Generator", () => applyUpgrade(game.shrine.generatorUnlock)),
                new Milestone(141, "ScrapCraft", 83, "Unlock the Factory itself", () => applyUpgrade(game.shrine.factoryUnlock)),
                new Milestone(142, "Legendary Scrap!", 90, "Craft Legendary Scrap", () => game.factory.legendaryScrap.gte(1)),
                new Milestone(143, "Fail... Repeat!", 89, "Repeat a beam", () => game.dimension == 508050),
                new Milestone(144, "Age of Automation", 85, "Unlock the Auto buyer building", () => applyUpgrade(game.shrine.autosUnlock)),
                new Milestone(145, "A new Era", 86, "Buy the first auto buyer", () => game.autos.autoBetterBarrels.level > 0),
                new Milestone(146, "A new magnet type?", 91, "Craft a Steel Magnet", () => game.factory.steelMagnets.gte(1)),
                new Milestone(148, "Exploit man 3D", 81, "Collect some Glitch Beams", () => game.glitchbeams.amount.gte(1000)),
                new Milestone(152, "Google Magnets", 2, () => "Have " + formatNumber(1e100) + " Magnets at once", () => game.magnets.gte(1e100)),
                new Milestone(154, "The strongest upgrade", 51, () => "Level stronger barrel tiers to 25", () => game.darkscrap.upgrades.strongerTiers.level > 24),
                new Milestone(156, "RPG v3 (Mastery 2.0)", 92, "Unlock Barrel Mastery", () => game.barrelMastery.isUnlocked()),
                new Milestone(157, "Influenced by the barrels", 1, "Unlock the first mastery upgrade", () => getTotalLevels(1) > 9),
                new Milestone(158, "There's more?!", 2, "Unlock the second mastery upgrade", () => getTotalLevels(2) > 9),
                new Milestone(230, "Scrapmas", 116, "Unlock Gifts (Earth)", () => game.solarSystem.upgrades.earth.level >= EarthLevels.GIFTS),
                new Milestone(159, "Uhh, why aren't you using them?", 93, "Refuse to spend your Mastery Tokens\nfor a while", () => game.barrelMastery.masteryTokens.gte(new Decimal(500))),
                new Milestone(231, "Lots of Love", 116, "Send a gift to someone", () => game.dimension == 508050),
                new Milestone(160, "Master Builder", 24, "Unlock the third mastery upgrade", () => getTotalLevels(3) > 9),
                new Milestone(161, "Topper", 93, "Hoard 2k Mastery Tokens for some reason", () => game.barrelMastery.masteryTokens.gte(new Decimal(2000))),
                new Milestone(124, "To The End Of The Universe", 74, () => "Mythus level 50", () => game.solarSystem.upgrades.mythus.level > 49),
                new Milestone(162, "My first 1M barrel", 0, "Have 1M mastery merges on barrel 204", () => game.barrelMastery.b[203] >= 1000000),
                new Milestone(232, "Is for me?", 116, "Receive a gift from someone", () => game.dimension == 508050),
                new Milestone(163, "Another yellow beam", 94, "Collect a golden beam", () => game.stats.totalgoldenbeamscollected >= 1),
                new Milestone(166, "Save the crabs!", 95, "Unlock Plastic Bags", () => game.skillTree.upgrades.unlockPlasticBags.level > 0),
                new Milestone(117, "For the Door Handle\nSalesman", 19, "Reach " + Decimal.pow(2, 15360).toFixed(2) + " Scrap", () => game.highestScrapReached.gte(Decimal.pow(2, 15360))),
                new Milestone(167, "Crab Saver I", 96, "Buy 25 Plastic Bags (in total)", () => game.stats.totalplasticbags.gte(25)),
                new Milestone(168, "Exponential Power", 16, "I thought this upgrade will be weak,\nbut it's actually very strong...", () => game.skillTree.upgrades.strongerMasteryMagnets.level > 0),
                new Milestone(170, "Crab Saver II", 96, "Buy 100 Plastic Bags (in total)", () => game.stats.totalplasticbags.gte(100)),
                new Milestone(233, "Laughing Out Loud", 116, "Leave a special message for someone...", () => game.dimension == 508050),
                new Milestone(169, "Cheap Path Done!", 16, "Unlock the Faster Merge Mastery tree upgrade", () => game.skillTree.upgrades.fasterMergeMastery.level > 0),
                new Milestone(171, "Green Upgrades", 95, "Level the first Plastic Bag upgrade to 25", () => game.plasticBags.upgrades.moreScrap.level > 24),
                new Milestone(125, "Level Push is OP", 75, () => "Reach Better Barrels level 5000", () => game.scrapUpgrades.betterBarrels.level > 4999),
                new Milestone(174, "Incredibly compact", 98, "Make Golden Scrap storms shorter", () => game.skillTree.upgrades.shortGSStorms.level > 0),
                new Milestone(175, "Crab Saver III", 96, "Buy 250 Plastic Bags (in total)", () => game.stats.totalplasticbags.gte(250)),
                new Milestone(176, "Scrap Collector", 97, "Unlock Auto Collectors (by buying a Skill Tree upgrade)", () => game.skillTree.upgrades.unlockAutoCollectors.level > 0),
                new Milestone(177, "Sand For The Crabs", 100, "Craft Buckets", () => game.factory.buckets.gte(1)),
                new Milestone(178, "Let's Collect Crabs!", 101, "Craft Fishing Nets", () => game.factory.fishingNets.gte(1)),
                new Milestone(225, "2Master4You", 93, "Unlock the fourth mastery upgrade", () => getTotalLevels(4) > 9),
                new Milestone(202, "Champion II", 0, () => "150 Achievements", () => game.ms.length > 149),
                new Milestone(173, "How is this possible?!", 74, "Reduce the costs of Mythus", () => game.skillTree.upgrades.cheaperMythus.level > 0),
                new Milestone(181, "Anti-Boring", 103, "Max. the first Auto Collector", () => game.collectors.beams.level > 24),
                new Milestone(180, "In the long run", 40, () => "Earn " + formatNumber(1e30) + " dark scrap", () => game.darkscrap.amount.gte(1e30)),
                new Milestone(182, "Anti-Rage", 103, "Max. the second Auto Collector", () => game.collectors.aerobeams.level > 24),
                new Milestone(196, "More than 100?!", 106, "Get 110 Reinforced Beams every beam", () => game.reinforcedbeams.upgrades.reinforce.level > 108),
                new Milestone(150, "The Legend", 90, "Have 100 Legendary Scrap at once", () => game.factory.legendaryScrap.gte(100)),
                new Milestone(183, "Anti-Bug", 103, "Max. the fifth Auto Collector", () => game.collectors.glitchbeams.level > 24),
                new Milestone(184, "Anti-Bullet Hell", 102, "Max. the sixth Auto Collector", () => game.collectors.tires.level > 74),
                new Milestone(198, "Balanced is fair", 76, () => "Keep the balance post-120", () => game.reinforcedbeams.upgrades.reinforce.level > 119 && game.reinforcedbeams.upgrades.strength.level * 2 > game.reinforcedbeams.upgrades.reinforce.level - 3),
                new Milestone(190, "I'm screwed", 108, "Unlock screws", () => game.skillTree.upgrades.unlockScrews.level > 0),
                new Milestone(185, "Crab Saver IV", 96, "Buy 1000 Plastic Bags (in total)", () => game.stats.totalplasticbags.gte(1000)),
                new Milestone(186, "This should be illegal", 101, "Have 50 Fishing Nets at the same time", () => game.factory.fishingNets.gte(50)),
                new Milestone(172, "On My Way to the Club", 63, "Unlock another powerful tire tree upgrade\nand level the second Plastic Bag upgrade to 50", () => game.skillTree.upgrades.tireBoost2.level > 0 && game.plasticBags.upgrades.moreTires.level > 49),
                new Milestone(187, "Rubix cube", 104, "Complete all three paths", () => game.skillTree.upgrades.fasterMergeMastery.level > 0 && game.skillTree.upgrades.cheaperMythus.level > 0 && game.skillTree.upgrades.unlockAutoCollectors.level > 0),
                new Milestone(188, "A hint of Wisdom", 16, "Make Merge Mastery much faster", () => game.skillTree.upgrades.fasterMergeMastery.level > 249),
                new Milestone(191, "Screw You!", 108, "Earn 100 screws (total)", () => game.stats.totalscrews.gte(100)),
                new Milestone(149, "He's afraid of something", 77, () => "Have 300k Reinforced Beams at once", () => game.reinforcedbeams.amount.gte(300000)),
                new Milestone(189, "The best barrel", 105, "Have 1M mastery merges on barrel 700", () => game.barrelMastery.b[699] >= 1000000),
                new Milestone(120, "Can't touch this", 69, () => "Reach " + formatNumber(new Decimal(2).pow(20480)) + " Scrap\nStop... scrap grinding time!", () => game.highestScrapReached.gte(Decimal.pow(2, 20480))),
                new Milestone(192, "Crab Saver V", 96, "Buy 2500 Plastic Bags (in total)", () => game.stats.totalplasticbags.gte(2500)),
                new Milestone(193, "Screw This Game!", 108, "Earn 5000 screws (total)", () => game.stats.totalscrews.gte(5000)),
                new Milestone(194, "From 3 to 4", 51, () => "Level stronger barrel tiers to 100", () => game.darkscrap.upgrades.strongerTiers.level > 99),
                new Milestone(151, "BRICKMAN", 64, "Reach Merge Mastery Level 10000", () => game.highestMasteryLevel >= 10000),
                new Milestone(195, "Screw This Upgrade!", 108, "Max. the first screw upgrade", () => game.screws.upgrades.fallingScrews.level > 9),
                new Milestone(197, "Crab Saver VI", 96, "Buy 5000 Plastic Bags (in total)", () => game.stats.totalplasticbags.gte(5000)),
                new Milestone(153, "Beam Factory", 82, () => "Have 1M normal Beams at once", () => game.beams.amount.gte(1000000)),
                new Milestone(199, "Screw it, I'm the new King", 107, () => "Earn " + formatNumber(1000000) + " screws (total)", () => game.stats.totalscrews.gte(1000000)),
                new Milestone(201, "Tire Wire Fire Hire", 26, () => "Unlock a new row of tire upgrades...", () => applyUpgrade(game.skillTree.upgrades.newTireUpgrades)),
                new Milestone(226, "5 Upgrade Mastery", 92, "Unlock the fifth mastery upgrade", () => getTotalLevels(5) > 9),
                new Milestone(203, "Champion III", 0, () => "200 Achievements", () => game.ms.length > 199),
                new Milestone(204, "Everyone can read it", 38, () => "Switch to the ultimate notation\nwhile having at least " + formatNumber(new Decimal(1e182)) + " magnets", () => game.settings.numberFormatType == 12 && game.magnets.gte(new Decimal(1e182))),
                new Milestone(205, "Scrap Coconut II", 99, () => "Merge coconuts", () => game.settings.coconut == true && (game.mergeQuests.dailyQuest.currentMerges >= 4000 || game.mergeQuests.dailyQuest.active == false)),
                new Milestone(206, "Power Beams", 77, () => "140 Beams per minute", () => game.dimension == 508050),
                new Milestone(207, "Schrottii", 109, () => "Find Schrottii", () => game.dimension == 508050),
                new Milestone(208, "Slower can be better", 87, () => "Make an autobuyer slower", () => game.dimension == 508050),
                new Milestone(209, "Cooked Crab", 110, () => "Noooooooooo", () => game.stats.totalplasticbags.gte(1200) && game.plasticBags.amount.lte(0)),
                new Milestone(211, "Falling Magnet Guys", 2, "Make Falling Magnets\nworth 100x more", () => game.skillTree.upgrades.fallingMagnetValue.level > 0),
                new Milestone(212, "Tim Mode", 112, "Unlock Time Mode", () => game.skillTree.upgrades.unlockTimeMode.level > 0),
                new Milestone(213, "Third Dimension", 112, () => "Start a run...", () => game.dimension == 508050),
                new Milestone(234, "Advent Calendar", 116, "Send some gifts to the people", () => game.stats.giftsSent.gte(24)),
                new Milestone(214, "Hot Wheels", 111, "Earn your first cogwheels!", () => game.cogwheels.amount.gte(0)),
                new Milestone(215, "Cog, the player?", 111, "Have 1000 cogwheels at once", () => game.cogwheels.amount.gte(1000)),
                new Milestone(216, "**** wheels", 113, () => "Earn 1000 cogwheels in a single run", () => game.dimension == 508050),
                new Milestone(217, "More Tokens yay", 14, "Because it was 9000 for so long.", () => game.skillTree.upgrades.higherDarkScrapTokenMax.level > 0),
                new Milestone(218, "F.U.N.", 114, "Make Glitch Beams funnier", () => game.skillTree.upgrades.funnyGlitchBeams.level > 0),
                new Milestone(219, "H.O.M.L.", 87, "Level the first Auto buyer to at least half of its max. level", () => game.autos.autoBetterBarrels.level >= game.autos.autoBetterBarrels.maxLevel / 2),
                new Milestone(220, "3.47", 104, "Complete all three paths (again)", () => game.skillTree.upgrades.veryFastCrafting.level > 0 && game.skillTree.upgrades.funnyGlitchBeams.level > 0 && game.skillTree.upgrades.higherDarkScrapTokenMax.level > 0),
                new Milestone(221, "Duck Tales", 115, "Do at least 100k merges on all duck barrels", () => { for (i in [141, 301, 308, 309, 315, 319, 323, 371, 381, 384, 391, 395, 401, 411, 425, 441, 451, 466, 471, 475, 485, 498, 508, 580, 586, 664, 729, 756]) if (game.barrelMastery.b[i - 1] < 100000) return false; return true; }),
                new Milestone(222, "This is useless", 2, "Get more passive magnets", () => game.tires.upgrades[3][0].level > 9),
                new Milestone(223, "A % Beam Prod Increase?", 47, "Get more beams... in %", () => game.tires.upgrades[3][1].level > 9),
                new Milestone(224, "Plastic Eff. Testing Agency", 95, "Cheaper Plastic Bags", () => game.tires.upgrades[3][2].level > 9),
                new Milestone(227, "Combine Everything", 65, "Do 100k self merges\n(Merges from auto merge do not count as self merges)", () => game.selfMerges > 99999),
                new Milestone(179, "Scrapyard v300", 68, "Upgrade scrapyard to level 301", () => game.mergeQuests.scrapyard > 300),
                new Milestone(235, "They Call Me Santa", 116, "Send a few gifts to the people", () => game.stats.giftsSent.gte(100)),
                new Milestone(147, "Time to go AFK...", 87, "Max. the first auto buyer", () => game.autos.autoBetterBarrels.level > 116),
                new Milestone(210, "It's been 84 years...", 27, "Level the fourth tire row to 50", () => game.tires.upgrades[3][0].level > 49 && game.tires.upgrades[3][1].level > 49 && game.tires.upgrades[3][2].level > 49),
                new Milestone(165, "Nobody can touch this", 69, () => "Reach " + formatNumber(new Decimal(2).pow(40960)) + " Scrap\nStop... scrap grinding time!", () => game.highestScrapReached.gte(Decimal.pow(2, 40960))),
                new Milestone(200, "Crab Saver VII", 96, "Buy 10000 Plastic Bags (in total)", () => game.stats.totalplasticbags.gte(10000)),
                new Milestone(229, "Need more\nNice", 30, () => "First Barrel produces more than " + formatNumber(new Decimal("6e9420")) + " Scrap", () => Barrel.getIncomeForLevel(0).gte(new Decimal("6e9420"))),
                new Milestone(228, "Nuclear Fusion", 65, "Do 1M self merges\n(Merges from auto merge do not count as self merges)\n(I'm sorry)", () => game.selfMerges > 999999),
                new Milestone(155, "Tire Club", 88, () => "Reach " + formatNumber(new Decimal("1e1e9")) + " tires\nand unlock the Tire Club!", () => game.tires.amount.gte("1e1000000000")),
                //new Milestone(166, "", 50, "", () => ),
                ],
        highlighted: 0, 
        tooltip: null,
        page: 0,
        maxPage: () => Math.floor((game.milestones.achievements.length - 1) / 25),
        changePage: d => {
            game.milestones.page += d;
            game.milestones.page = Utils.clamp(game.milestones.page, 0, game.milestones.maxPage());
            game.milestones.tooltip = null;
        },
        unlocked: [],
        getHighestUnlocked: function () {
            let highest = 0;
            for (let i = 0; i < game.milestones.achievements.length; i++) {
                if (game.milestones.achievements[i].id > highest && game.ms.includes(game.milestones.achievements[i].id)) {
                    highest = game.milestones.achievements[i].id;
                }
            }
            return highest;
        },
        getNext: function () {
            let lowest = 9999;
            let low = 9999;
            for (let i = 0; i < game.milestones.achievements.length; i++) {
                if (!game.ms.includes(game.milestones.achievements[i].id - 1) && lowest > i) {
                    lowest = i;
                    low = game.milestones.achievements[i].id;
                }
            }
            return low;
        }
    },
    barrelGallery:
    {
        getMaxPage: () => Math.round(Math.round(Barrel.getMaxLevelBarrel()) / 20)
    },
    settings:
    {
        changeOptionsPage: d => {
            game.settings.optionsPage += d;
            game.settings.optionsPage = Utils.clamp(game.settings.optionsPage, 0, 2);
        },
        numberFormatType: 0,
        barrelGalleryPage: 0,
        optionsPage: 0,
        barrelShadows: false,
        useCachedBarrels: false,
        barrelQuality: 1,
        destroyBarrels: false,
        autoMerge: false,
        autoConvert: false,
        resetConfirmation: true,
        lowPerformance: false,
        musicOnOff: false,
        barrelSpawn: true,
        musicSelect: 0,
        C: 1,
        FPS: 9999,
        beamTimer: false,
        coconut: false,
        musicVolume: 0,
        displayFPS: false,
    }
};
