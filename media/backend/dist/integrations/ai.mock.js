import { Platform } from '../domain/enums';
export class MockAIProvider {
    async generateCampaignContent(instruction, platforms, imageCount) {
        const result = {};
        // Simulate latency
        await new Promise(res => setTimeout(res, 1500));
        for (const platform of platforms) {
            let caption = '';
            let hashtags = [];
            switch (platform) {
                case Platform.INSTAGRAM:
                    caption = `📸 Wow, check this out! ${instruction} \n\n#InstagramVibes`;
                    hashtags = ['#InstagramVibes', '#PhotoOfTheDay'];
                    break;
                case Platform.LINKEDIN:
                    caption = `I am excited to announce: ${instruction}. \n\nThis represents a significant milestone for our professional community.`;
                    hashtags = ['#Professional', '#Milestone'];
                    break;
                case Platform.X:
                    caption = `Just dropping this here: ${instruction} 🔥🔥`;
                    hashtags = ['#Tech', '#Update'];
                    break;
                default:
                    caption = `Here is our post about: ${instruction}`;
                    hashtags = ['#General'];
            }
            result[platform] = { caption, hashtags };
        }
        return result;
    }
}
