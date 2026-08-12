import { PlatformPost, PlatformName } from '../../types';

export const mockGenerateContent = async (
  instruction: string, 
  platforms: PlatformName[]
): Promise<Record<string, PlatformPost>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const posts: Record<string, PlatformPost> = {};
      
      platforms.forEach(platform => {
        let caption = '';
        let hashtags: string[] = [];
        
        switch(platform) {
          case 'linkedin':
            caption = `🚀 Exciting news!\n\n${instruction}\n\nWe are thrilled to share our latest update with our professional network. Let us know your thoughts below!`;
            hashtags = ['#Professional', '#Update', '#Business'];
            break;
          case 'instagram':
            caption = `✨ Something big is here!\n\n${instruction}\n\nLink in bio to learn more! 📸`;
            hashtags = ['#InstaGood', '#New', '#Lifestyle'];
            break;
          case 'x':
            caption = `${instruction.substring(0, 200)}... 🚀\nJoin the conversation!`;
            hashtags = ['#Tech', '#News'];
            break;
          default:
            caption = `Update: ${instruction}`;
            hashtags = ['#Update'];
        }

        posts[platform] = {
          id: `post-${Date.now()}-${platform}`,
          campaignId: 'mock-campaign-id',
          platform,
          media: [], // Media would be attached here
          caption,
          hashtags,
          status: 'AWAITING_APPROVAL'
        };
      });
      
      resolve(posts);
    }, 2500); // Simulate network delay
  });
};
