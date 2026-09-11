package main

import "sync"

// 预定义
var (
	// 最初的伙伴
	starterPokemon = map[int]bool{
		1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 25: true,
		133: true, 152: true, 153: true, 154: true, 155: true, 156: true, 157: true, 158: true, 159: true, 160: true,
		252: true, 253: true, 254: true, 255: true, 256: true, 257: true, 258: true, 259: true, 260: true,
		387: true, 388: true, 389: true, 390: true, 391: true, 392: true, 393: true, 394: true, 395: true,
		495: true, 496: true, 497: true, 498: true, 499: true, 500: true, 501: true, 502: true, 503: true,
		650: true, 651: true, 652: true, 653: true, 654: true, 655: true, 656: true, 657: true, 658: true,
		722: true, 723: true, 724: true, 725: true, 726: true, 727: true, 728: true, 729: true, 730: true,
		810: true, 811: true, 812: true, 813: true, 814: true, 815: true, 816: true, 817: true, 818: true,
		906: true, 907: true, 908: true, 909: true, 910: true, 911: true, 912: true, 913: true, 914: true,
	}

	// 化石宝可梦
	fossilPokemon = map[int]bool{
		138: true, 139: true, 140: true, 141: true, 142: true, 345: true, 346: true, 347: true, 348: true,
		408: true, 409: true, 410: true, 411: true, 564: true, 565: true, 566: true, 567: true,
		696: true, 697: true, 698: true, 699: true, 880: true, 881: true, 882: true, 883: true,
	}

	// 大器晚成的宝可梦
	latePokemon = map[int]bool{
		147: true, 148: true, 149: true, 246: true, 247: true, 248: true, 371: true, 372: true, 373: true,
		374: true, 375: true, 376: true, 443: true, 444: true, 445: true, 633: true, 634: true, 635: true,
		704: true, 705: true, 706: true, 782: true, 783: true, 784: true, 885: true, 886: true, 887: true,
		996: true, 997: true, 998: true,
	}

	// 究极异兽
	ultraBeastPokemon = map[int]bool{
		793: true, 794: true, 795: true, 796: true, 797: true, 798: true, 799: true,
		803: true, 804: true, 805: true, 806: true,
	}

	// 悖谬宝可梦
	paradoxPokemon = map[int]bool{
		984: true, 985: true, 986: true, 987: true, 988: true, 989: true, 990: true, 991: true, 992: true,
		993: true, 994: true, 995: true, 1005: true, 1006: true, 1009: true, 1010: true,
		1020: true, 1021: true, 1022: true, 1023: true,
	}
)

// 全局变量
var (
	pokemonData []Pokemon
	speciesMap  = make(map[int]SpeciesData)

	// 翻译数据存储
	i18nData = make(map[string]I18nTranslation)

	i18nSpecies   = make(map[string]I18nTranslation)
	i18nTypes     = make(map[string]I18nTranslation)
	i18nAbilities = make(map[string]I18nTranslation)
	i18nMoves     = make(map[string]I18nTranslation)
	i18nItems     = make(map[string]I18nTranslation)

	processedNames     = make(map[string]bool) // 避免重复处理
	processedTypes     = make(map[string]bool)
	processedAbilities = make(map[string]bool)

	i18nMutex sync.RWMutex // 新增互斥锁用于保护i18n相关数据

	// 语言代码映射
	languageMapping = map[string]string{
		"en":      "en",
		"ja":      "ja",
		"ja-hrkt": "ja",
		"es":      "es",
		"de":      "de",
		"it":      "it",
		"fr":      "fr",
		"zh-hant": "zh-Hant",
		"zh-hans": "zh-Hans",
		"ko":      "ko",
	}
)
