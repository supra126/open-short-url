export interface UtmValues {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  utmId: string;
  utmSourcePlatform: string;
}

export interface UtmTemplate {
  id: string;
  labelKey: string;
  values: Partial<UtmValues>;
}

export const UTM_TEMPLATES: UtmTemplate[] = [
  {
    id: 'facebook-ads',
    labelKey: 'urls.templates.facebookAds',
    values: {
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmSourcePlatform: 'meta',
    },
  },
  {
    id: 'google-ads',
    labelKey: 'urls.templates.googleAds',
    values: {
      utmSource: 'google',
      utmMedium: 'cpc',
      utmSourcePlatform: 'google',
    },
  },
  {
    id: 'google-shopping',
    labelKey: 'urls.templates.googleShopping',
    values: {
      utmSource: 'google',
      utmMedium: 'shopping',
      utmSourcePlatform: 'google',
    },
  },
  {
    id: 'email-newsletter',
    labelKey: 'urls.templates.emailNewsletter',
    values: { utmSource: 'newsletter', utmMedium: 'email' },
  },
  {
    id: 'social-post',
    labelKey: 'urls.templates.socialPost',
    values: { utmMedium: 'social' },
  },
  {
    id: 'paid-social',
    labelKey: 'urls.templates.paidSocial',
    values: { utmMedium: 'paid_social' },
  },
  {
    id: 'affiliate',
    labelKey: 'urls.templates.affiliate',
    values: { utmMedium: 'affiliate' },
  },
  {
    id: 'influencer',
    labelKey: 'urls.templates.influencer',
    values: { utmMedium: 'influencer' },
  },
  {
    id: 'line',
    labelKey: 'urls.templates.line',
    values: { utmSource: 'line', utmMedium: 'social' },
  },
  {
    id: 'retargeting',
    labelKey: 'urls.templates.retargeting',
    values: { utmMedium: 'cpc' },
  },
];

export const EMPTY_UTM_VALUES: UtmValues = {
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmTerm: '',
  utmContent: '',
  utmId: '',
  utmSourcePlatform: '',
};
