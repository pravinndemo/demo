const SSU_APP_ID = 'cdb5343c-51c1-ec11-983e-002248438fff';
const SSU_FORM_ID = '4176b880-fcc3-4ee7-b915-ab163011bbcb';

export const buildHereditamentUrl = (environmentUrl: string, suId: string): string => {
  const baseUrl = environmentUrl.trim().replace(/\/$/, '');
  const normalizedSuid = suId.trim();
  if (!baseUrl || !normalizedSuid) {
    return '';
  }

  return `${baseUrl}/main.aspx?appid=${SSU_APP_ID}&newWindow=true&pagetype=entityrecord&etn=voa_ssu&id=${encodeURIComponent(normalizedSuid)}&formid=${SSU_FORM_ID}`;
};
