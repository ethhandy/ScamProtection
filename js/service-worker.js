var objBrowser = chrome || browser;

const LS = {
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
};

objBrowser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        onMessage(request, sender).then((resp) => {
            sendResponse({
                resp
            });
        });

        return true;
    }
);

function onMessage(request, sender) {
    return new Promise(async resolve => {
        var strOption = request.func;
        var strResponse = "";
    
        switch(strOption) {
            case 'highlight_option' :
                strResponse = await LS.getItem("ext-etheraddresslookup-show_style");
                break;
            case 'blockchain_explorer' :
                strResponse = await LS.getItem("ext-etheraddresslookup-blockchain_explorer");
                if(!strResponse) {
                    strResponse = "https://etherscan.io/address";
                }
                break;
            case 'blacklist_domains' :
                //This option is enabled by default
                const blackListDomains = await LS.getItem("ext-etheraddresslookup-blacklist_domains");
                if(!blackListDomains)
                    strResponse = 1;
                else
                    strResponse = blackListDomains;
                break;
            case '3rd_party_blacklist_domains' :
                //This option is enabled by defailt
                const thirdPartyBlackListDomains = await LS.getItem("ext-etheraddresslookup-3rd_party_blacklist_domains");
                if(!thirdPartyBlackListDomains)
                    strResponse = 1;
                else
                    strResponse = thirdPartyBlackListDomains;
                break;
            case 'blacklist_domain_list' :
                console.log("Getting blacklisted domain list");
                strResponse = await getBlacklistedDomains("eal");
                break;
            case '3p_blacklist_domain_list' :
                console.log("Getting 3p blacklisted domain list");
                strResponse = await getBlacklistedDomains("3p");
                break;
            case 'blacklist_uri_list' :
                console.log("Getting the blacklist uri list");
                strResponse = await getBlacklistedDomains("uri");
                break;
            case 'use_3rd_party_blacklists' :
                //This option is enabled by default
                const thirdPartyBlackList = await LS.getItem("ext-etheraddresslookup-use_3rd_party_blacklist");
                if(!thirdPartyBlackList) {
                    strResponse = 1;
                } else {
                    strResponse = thirdPartyBlackList;
                }
                break;
            case 'block_punycode_domains' :
                //This option is disabled by default
                const punyCodeBlackListDomains = await LS.getItem("ext-etheraddresslookup-block_punycode_blacklist_domains");
                if(!punyCodeBlackListDomains)
                    strResponse = 0;
                else
                    strResponse = punyCodeBlackListDomains;
                break;
            case 'whitelist_domain_list' :
                console.log("Getting whitelisted domain list");
                strResponse = await getWhitelistedDomains();
                break;
            case 'rpc_details' :
                const rpcNodeDetails = await LS.getItem("ext-etheraddresslookup-rpc_node_details");
                if(!rpcNodeDetails) {
                    strResponse = JSON.stringify({
                            "network_id": 1,
                            "chain_id": 1,
                            "name": "MAINNET",
                            "type": "ETH"
                        })
                } else {
                    strResponse = rpcNodeDetails;
                }
                break;
            case 'rpc_provider' :
                const rpcNode = await LS.getItem("ext-etheraddresslookup-rpc_node");
                if(!rpcNode)
                    strResponse = "https://mainnet.infura.io/v3/02b145caa61b49998168f2b97d4ef323";
                else
                    strResponse = rpcNode;
                break;
            case 'rpc_default_provider' :
                strResponse = "https://mainnet.infura.io/v3/02b145caa61b49998168f2b97d4ef323";
                break;
            case 'perform_address_lookups' :
                //This option is enabled by default
                const performAddressLookup = await LS.getItem("ext-etheraddresslookup-perform_address_lookups");
                if(!performAddressLookup) {
                    strResponse = 1;
                } else {
                    strResponse = performAddressLookup;
                }
                break;
            case 'blacklist_whitelist_domain_list' :
                var objDomainLists = {"blacklist": "", "whitelist": ""};
                var objBlacklist = JSON.parse(await getBlacklistedDomains("eal"));
                objDomainLists.blacklist = objBlacklist.domains;
                objDomainLists.whitelist = await getWhitelistedDomains();
                strResponse = JSON.stringify(objDomainLists);
                break;
            case 'twitter_validation' :
                //This option is enabled by default
                const twitterValidation = await LS.getItem("ext-etheraddresslookup-twitter_validation");
                if(!twitterValidation) 
                    strResponse = 1;
                else
                    strResponse = twitterValidation;
                break;
            case 'twitter_lists':
                //See when they were last fetched
                let twitter_lists = {
                    "last_fetched": 0,
                    "whitelist": [],
                    "blacklist": []
                };
    
                const addressLookupTwitterLists = await LS.getItem("ext-etheraddresslookup-twitter_lists");
    
                if(addressLookupTwitterLists) {
                    let saved_settings = JSON.parse(addressLookupTwitterLists);
                    twitter_lists.last_fetched = saved_settings.last_fetched;
                }
    
                if((Math.floor(Date.now() - twitter_lists.last_fetched)) > 600*1000) {
                    fetch("https://raw.githubusercontent.com/MrLuit/EtherScamDB/master/_data/twitter.json")
                    .then(res => res.json())
                    .then(async (lists) => {
                        twitter_lists.last_fetched = Date.now();
                        
                        //We only need the Twitter IDs
                        Object.entries(lists.whitelist).forEach(
                            ([twitter_userid, screename]) => {
                                twitter_lists.whitelist.push(twitter_userid);
                            }
                        );
    
                        Object.entries(lists.blacklist).forEach(
                            ([twitter_userid, screename]) => {
                                twitter_lists.blacklist.push(twitter_userid);
                            }
                        );
    
                        await LS.setItem("ext-etheraddresslookup-twitter_lists", JSON.stringify(twitter_lists));
                    });
                }
    
                if(addressLookupTwitterLists) {
                    var cached_list = JSON.parse(addressLookupTwitterLists);
                    twitter_lists.whitelist = cached_list.whitelist;
                    twitter_lists.blacklist = cached_list.blacklist;
                }
    
                strResponse = JSON.stringify(twitter_lists);
                break;
            case 'signature_inject' :
                //This option is enabled by default
                const signatureInject = await LS.getItem("ext-etheraddresslookup-signature_inject");
                if(!signatureInject)
                    strResponse = 1;
                else
                    strResponse = signatureInject;
                break;
            case 'user_domain_bookmarks' :
                // Fetches the user domain bookmarks - these are domains they trust
                var strBookmarks = await LS.getItem("ext-etheraddresslookup-bookmarks");
                //No bookmarks have been set, set the default ones.
                if(!strBookmarks) {
                    var arrBookmarks = new Array();
                    arrBookmarks.push({
                        "icon": "https://www.google.com/s2/favicons?domain=https://mycrypto.com",
                        "url": "https://mycrypto.com"
                    });
                    arrBookmarks.push({
                        "icon": "images/bookmarks/etherscan.png",
                        "url": "https://etherscan.io"
                    });
                    arrBookmarks.push({
                        "icon": "images/bookmarks/etherchain.jpg",
                        "url": "https://etherchain.org"
                    });
                    arrBookmarks.push({
                        "icon": "images/bookmarks/ethplorer.jpg",
                        "url": "https://ethplorer.io"
                    });
                    arrBookmarks.push({
                        "icon": "images/bookmarks/rethereum.png",
                        "url": "https://reddit.com/r/ethereum"
                    });
                    arrBookmarks.push({
                        "icon": "images/bookmarks/rethtrader.png",
                        "url": "https://reddit.com/r/ethtrader"
                    });
                } else {
                    arrBookmarks = JSON.parse(strBookmarks);
                }
            
                strResponse = JSON.stringify(arrBookmarks);
                break;
            case 'change_ext_icon' :
                // Changes the extension icon
                let strReason = "";
                if(request.type) {
                    switch(request.type) {
                        case 'thirdparty':
                            strReason = request.icon + " by a thirdparty list";
                            break;
                        case 'punycode':
                            strReason = request.icon + " due to punycode domain";
                            break; 
                        case 'blacklisted' :
                            strReason = "Blacklisted by the EAL extension";
                            break;
                        case 'levenshtein' :
                            strReason = "Blacklisted as too similar to a trusted domain";
                            break;  
                        case 'whitelisted' :
                            strReason = "Trusted by the EAL extension";
                            break;                         
                        case 'bookmarked':
                            strReason = "Trusted by your bookmarks in EAL";
                            break;
                        default:
                            strReason = "";
                            break;
                    }
                }
    
                switch(request.icon) {
                    case 'whitelisted' :
                        chrome.action.setIcon({
                            path: "./../images/ether-128x128-green_badge.png",
                            tabId: sender.tab.id
                        });
    
                        chrome.action.setTitle({
                            title: ["This domain is recognised as legitimate by EtherAddressLookup", strReason].filter(i => i).join(" - ")
                        });
                    break;
                    case 'blacklisted' :
                        chrome.action.setIcon({
                            path: "./../images/ether-128x128-red_badge.png",
                            tabId: sender.tab.id
                        });
    
                        chrome.action.setTitle({
                            title: ["This domain is recognised as bad by EtherAddressLookup", strReason].filter(i => i).join(" - ")
                        });
                    break;                    
                    case 'neutral' :
                    default :
                        chrome.action.setIcon({
                            path: "./../images/ether-128x128.png",
                            tabId: sender.tab.id
                        });
    
                        chrome.action.setTitle({
                            title: "EtherAddressLookup (Powered by MyCrypto)",
                        });
    
                    break;                    
                }
                break;
            default:
                strResponse = "unsupported";
                break;
        }
    
        resolve(strResponse);
    });
}

async function getBlacklistedDomains(strType)
{
    var objEalBlacklistedDomains = {
        "eal": {
            "timestamp": 0,
            "domains": [],
            "format": "plain",
            "repo": "https://raw.githubusercontent.com/409H/EtherAddressLookup/master/blacklists/domains.json",
            "identifer": "eal"
        },
        "uri": {
            "timestamp": 0,
            "domains": [],
            "format": "plain",
            "repo": "https://raw.githubusercontent.com/409H/EtherAddressLookup/master/blacklists/uri.json",
            "identifer": "uri"
        },
        "third_party": {
            "phishfort": {
                "timestamp": 0,
                "domains": [],
                "format": "plain",
                "repo": "https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/domains.json",
                "identifer": "phishfort"
            },
            "segasec": {
                "timestamp": 0,
                "domains": [],
                "format": "sha256",
                "repo": "https://segasec.github.io/PhishingFeed/phishing-domains-sha256.json",
                "identifer": "segasec"
            }
        }
    };
    //See if we need to get the blacklisted domains - ie: do we have them cached?
    const blacklistDomainList = await LS.getItem("ext-etheraddresslookup-blacklist_domains_list");
    if (!blacklistDomainList) {
        await updateAllBlacklists(objEalBlacklistedDomains);
    } else {
        var objBlacklistedDomains = blacklistDomainList;
        //Check to see if the cache is older than 5 minutes, if so re-cache it.
        objBlacklistedDomains = JSON.parse(objBlacklistedDomains);
        console.log("Domains last fetched: " + (Math.floor(Date.now() / 1000) - objBlacklistedDomains.timestamp) + " seconds ago");
        if (objBlacklistedDomains.timestamp == 0 || (Math.floor(Date.now() / 1000) - objBlacklistedDomains.timestamp) > 300) {
            await updateAllBlacklists(objEalBlacklistedDomains);
        }
    }

    strType = strType || "eal";
    if(strType === "eal") {
        strType = "";
    } else {
        strType = `${strType}_`;
    }

    return await LS.getItem(`ext-etheraddresslookup-${strType}blacklist_domains_list`);
}

async function updateAllBlacklists(objEalBlacklistedDomains)
{
    let arrDomains_1 = await getBlacklistedDomainsFromSource(objEalBlacklistedDomains.eal);
    objEalBlacklistedDomains.eal.timestamp = Math.floor(Date.now() / 1000);
    objEalBlacklistedDomains.eal.domains = arrDomains_1.filter((v,i,a)=>a.indexOf(v)==i); 

    await LS.setItem("ext-etheraddresslookup-blacklist_domains_list", JSON.stringify(objEalBlacklistedDomains.eal));
    
    let arrDomains_2 = await getBlacklistedDomainsFromSource(objEalBlacklistedDomains.uri)
    objEalBlacklistedDomains.uri.timestamp = Math.floor(Date.now() / 1000);
    objEalBlacklistedDomains.uri.domains = arrDomains_2.filter((v,i,a)=>a.indexOf(v)==i);

    await LS.setItem("ext-etheraddresslookup-uri_blacklist_domains_list", JSON.stringify(objEalBlacklistedDomains.uri));

    if( [null, undefined, 1].indexOf(await LS.getItem("ext-etheraddresslookup-use_3rd_party_blacklist")) >= 0) {
        let phishDomains = await getBlacklistedDomainsFromSource(objEalBlacklistedDomains.third_party.phishfort)

        let arrPhishFortBlacklist = [];
        // De-dupe from the main EAL source - save on space.
        let objEalBlacklist = await LS.getItem("ext-etheraddresslookup-blacklist_domains_list");
        if(objEalBlacklist) {
            objEalBlacklist = JSON.parse(objEalBlacklist);
            let arrEalBlacklist = objEalBlacklist.domains;
            var intBlacklistLength = phishDomains.length;
            while(intBlacklistLength--) {
                if(arrEalBlacklist.indexOf(phishDomains[intBlacklistLength]) < 0) {
                    arrPhishFortBlacklist.push(phishDomains[intBlacklistLength])
                }
            }
        }

        objEalBlacklistedDomains.third_party.phishfort.timestamp = Math.floor(Date.now() / 1000);
        objEalBlacklistedDomains.third_party.phishfort.domains = arrPhishFortBlacklist;

        await LS.setItem("ext-etheraddresslookup-3p_blacklist_domains_list", JSON.stringify(objEalBlacklistedDomains.third_party));

        let thridPartyDomains = await getBlacklistedDomainsFromSource(objEalBlacklistedDomains.third_party.segasec);
        objEalBlacklistedDomains.third_party.segasec.timestamp = Math.floor(Date.now() / 1000);
        objEalBlacklistedDomains.third_party.segasec.domains = thridPartyDomains.filter((v,i,a)=>a.indexOf(v)==i);

        await LS.setItem("ext-etheraddresslookup-3p_blacklist_domains_list", JSON.stringify(objEalBlacklistedDomains.third_party));
    }
}

async function getWhitelistedDomains()
{
    let objWhitelistedDomains = {"timestamp":0,"domains":[]};
    //See if we need to get the blacklisted domains - ie: do we have them cached?
    const whiteListDomainsList = await LS.getItem("ext-etheraddresslookup-whitelist_domains_list");
    if (!whiteListDomainsList) {
        getWhitelistedDomainsFromSource().then(async function (arrDomains) {
            objWhitelistedDomains.timestamp = Math.floor(Date.now() / 1000);
            objWhitelistedDomains.domains = arrDomains;

            await LS.setItem("ext-etheraddresslookup-whitelist_domains_list", JSON.stringify(objWhitelistedDomains));
            return objWhitelistedDomains.domains;
        });
    } else {
        objWhitelistedDomains = whiteListDomainsList;
        //Check to see if the cache is older than 5 minutes, if so re-cache it.
        objWhitelistedDomains = JSON.parse(objWhitelistedDomains);
        console.log("Whitelisted domains last fetched: " + (Math.floor(Date.now() / 1000) - objWhitelistedDomains.timestamp) + " seconds ago");
        if ((Math.floor(Date.now() / 1000) - objWhitelistedDomains.timestamp) > 300) {
            console.log("Caching whitelisted domains again.");
            getWhitelistedDomainsFromSource().then(async function (arrDomains) {
                objWhitelistedDomains.timestamp = Math.floor(Date.now() / 1000);
                objWhitelistedDomains.domains = arrDomains;

                await LS.setItem("ext-etheraddresslookup-whitelist_domains_list", JSON.stringify(objWhitelistedDomains));
                return objWhitelistedDomains.domains;
            });
        }
    }

    return objWhitelistedDomains.domains;
}

async function getBlacklistedDomainsFromSource(objBlacklist)
{
    try {
        console.log("Getting blacklist from GitHub now: "+ objBlacklist.repo);
        let objResponse = await fetch(objBlacklist.repo);
        return objResponse.json();
    }
    catch(objError) {
        console.log("Failed to get blacklist for "+ objBlacklist.repo, objError);
    }
}

async function getWhitelistedDomainsFromSource()
{
    try {
        console.log("Getting whitelist from GitHub now: https://raw.githubusercontent.com/409H/EtherAddressLookup/master/whitelists/domains.json");
        let objResponse = await fetch("https://raw.githubusercontent.com/409H/EtherAddressLookup/master/whitelists/domains.json");
        return objResponse.json();
    }
    catch(objError) {
        console.log("Failed to get whitelist for https://raw.githubusercontent.com/409H/EtherAddressLookup/master/whitelists/domains.json", objError);
    }
}
