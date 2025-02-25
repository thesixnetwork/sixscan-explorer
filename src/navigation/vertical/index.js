import store from '@/store';
import { isTestnet } from '../../libs/utils';

const modules = [
  {
    scope: 'normal',
    title: 'summary',
    route: 'info'
  },
  {
    scope: 'normal',
    title: 'blocks',
    route: 'blocks'
  },
  {
    scope: 'normal',
    title: 'Validators',
    route: 'staking'
  },
  // {
  //   scope: 'normal',
  //   title: 'governance',
  //   route: 'governance',
  //   exclude: 'emoney'
  // },
  {
    scope: 'normal',
    title: 'uptime',
    route: 'uptime'
  },
  // {
  //   scope: 'normal',
  //   title: 'Transactions Gen2',
  //   route: 'gen2Txn'
  // },
  {
    scope: 'cos-mos',
    title: 'gravity',
    route: 'gravity'
  },
  {
    scope: 'osmosis',
    title: 'trade',
    route: 'osmosis-trade'
  }
];

function processMenu() {
  const chainMenus = [];
  Object.keys(store.state.chains.config).forEach(chain => {
    const menu = {
      title: store.state.chains.config[chain].chain_title,
      icon: store.state.chains.config[chain].logo
    };
    const { excludes } = store.state.chains.config[chain];
    const children = [];
    modules.forEach(m => {
      if (excludes === undefined || excludes.indexOf(m.route) === -1) {
        if (m.scope.match('normal') || m.scope.match(chain)) {
          children.push({
            // header: `item-${chain}-${m.route}`,
            title: m.title,
            section: 'chain',
            route: { name: m.route, params: { chain } }
          });
        }
      }
    });
    menu.children = children;
    chainMenus.push(menu);
  });
  chainMenus.push({ header: 'SOCIALS', section: 'social' });
  chainMenus.push({
    title: 'Facebook',
    href: 'https://www.facebook.com/thesixnetwork',
    icon: 'FacebookIcon',
    section: 'social'
  });
  chainMenus.push({
    title: 'Twitter',
    href: 'https://twitter.com/theSIXnetwork',
    icon: 'TwitterIcon',
    section: 'social'
  });
  chainMenus.push({
    title: 'Gitbook',
    href:
      'https://sixnetwork.gitbook.io/six-protocol/six-protocol/introduction',
    icon: 'BookIcon',
    section: 'social'
  });
  chainMenus.push({
    title: 'Discord',
    href: 'https://discord.gg/5gJQCXzcWf',
    icon: 'EyeIcon',
    section: 'social'
  });
  chainMenus.push({
    title: 'Github',
    href: 'https://github.com/thesixnetwork',
    icon: 'GithubIcon',
    section: 'social'
  });
  chainMenus.push({
    title: 'Telegram',
    href: 'https://t.me/SIXNetwork',
    icon: 'NavigationIcon',
    section: 'social'
  });

  return chainMenus;
}

export default processMenu();
