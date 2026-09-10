const { google } = require('googleapis');
const axios = require('axios');
const path = require('path');
const { isAllowedEducationalContent } = require('../utils/educationalFilter');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

/**
 * Extract video or playlist ID from YouTube URL
 */
const extractId = (url) => {
    const videoMatch = url.match(/(?:v=|youtu\.be\/|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (videoMatch) return { type: 'video', id: videoMatch[1] };

    const playlistMatch = url.match(/(?:list=)([a-zA-Z0-9_-]+)/);
    if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };

    return { type: null, id: null };
};

/**
 * Convert ISO 8601 duration (e.g., PT1M30S) to readable format
 */
const formatDuration = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get metadata for YouTube video or playlist
 */
const getYoutubeMetadata = async (url, maxPlaylistVideos = null) => {
    try {
        const { type, id } = extractId(url);
        if (!type) return { error: 'Invalid YouTube URL' };

        if (type === 'video') {
            const res = await axios.get('https://youtube.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: id,
                    key: process.env.YOUTUBE_API_KEY
                }
            });

            if (!res.data.items || !res.data.items.length) return { error: 'Video not found' };

            const item = res.data.items[0];

            // Validate educational eligibility
            const eduCheck = isAllowedEducationalContent({
                title: item.snippet.title,
                description: item.snippet.description,
                channel: item.snippet.channelTitle,
                categoryId: item.snippet.categoryId
            });

            if (!eduCheck.allowed) {
                const catName = eduCheck.categoryName || 'Entertainment';
                return {
                    error: `LearnProof is an educational platform. This video is categorized under ${catName} and does not contain educational course material.`
                };
            }

            return {
                type: 'video',
                id: id,
                title: item.snippet.title,
                description: item.snippet.description,
                channel: item.snippet.channelTitle,
                published_at: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                duration: formatDuration(item.contentDetails.duration),
                view_count: item.statistics.viewCount || '0',
                like_count: item.statistics.likeCount || '0',
                url: `https://www.youtube.com/watch?v=${id}`
            };
        } else if (type === 'playlist') {
            const plRes = await axios.get('https://youtube.googleapis.com/youtube/v3/playlists', {
                params: {
                    part: 'snippet,contentDetails',
                    id: id,
                    key: process.env.YOUTUBE_API_KEY
                }
            });

            if (!plRes.data.items || !plRes.data.items.length) return { error: 'Playlist not found' };

            const playlistItem = plRes.data.items[0];

            // Validate playlist educational eligibility
            const eduCheck = isAllowedEducationalContent({
                title: playlistItem.snippet.title,
                description: playlistItem.snippet.description,
                channel: playlistItem.snippet.channelTitle
            });

            if (!eduCheck.allowed) {
                const catName = eduCheck.categoryName || 'Entertainment';
                return {
                    error: `LearnProof is an educational platform. This playlist is categorized under ${catName} and does not contain educational course material.`
                };
            }

            let videos = [];
            let nextPageToken = null;
            let videosFetched = 0;

            while (true) {
                const currentMax = maxPlaylistVideos ? Math.min(50, maxPlaylistVideos - videosFetched) : 50;
                if (maxPlaylistVideos && currentMax <= 0) break;

                const itemsRes = await axios.get('https://youtube.googleapis.com/youtube/v3/playlistItems', {
                    params: {
                        part: 'snippet',
                        playlistId: id,
                        maxResults: currentMax,
                        pageToken: nextPageToken,
                        key: process.env.YOUTUBE_API_KEY
                    }
                });

                if (!itemsRes.data.items) break;

                const pageVideos = itemsRes.data.items
                    .filter(v => v.snippet?.resourceId?.kind === 'youtube#video')
                    .map(v => ({
                        video_id: v.snippet.resourceId.videoId,
                        title: v.snippet.title,
                        description: v.snippet.description || '',
                        position: (v.snippet.position != null ? v.snippet.position : videosFetched) + 1,
                        url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`
                    }));

                if (pageVideos.length) {
                    videos.push(...pageVideos);
                    videosFetched += pageVideos.length;
                }

                nextPageToken = itemsRes.data.nextPageToken;
                if (!nextPageToken || (maxPlaylistVideos && videosFetched >= maxPlaylistVideos)) break;
            }

            return {
                type: 'playlist',
                id: id,
                title: playlistItem.snippet.title,
                description: playlistItem.snippet.description,
                channel: playlistItem.snippet.channelTitle,
                published_at: playlistItem.snippet.publishedAt,
                thumbnail: playlistItem.snippet.thumbnails.high?.url || playlistItem.snippet.thumbnails.default?.url,
                video_count: playlistItem.contentDetails.itemCount,
                videos: videos,
                total_videos_fetched: videos.length,
                url: `https://www.youtube.com/playlist?list=${id}`
            };
        }
    } catch (error) {
        return { error: `API Error: ${error.message}` };
    }
};

/**
 * Convert ISO 8601 duration (e.g., PT1M30S) to seconds
 */
const parseDurationToSeconds = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
};

/**
/**
 * Convert plain text duration (e.g. 1:20:04 or 10:30) to seconds
 */
const parseDurationText = (durationText) => {
    if (!durationText) return 0;
    const parts = durationText.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) {
        // H:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // SS
        return parts[0];
    }
    return 0;
};

/**
 * Helper to parse a single YouTube item from search results
 */
const parseRawItem = (item, results, seenIds) => {
    // 1. Check for videoRenderer
    if (item.videoRenderer) {
        const vr = item.videoRenderer;
        const durationText = vr.lengthText?.simpleText || "";
        const durationSec = parseDurationText(durationText);
        
        // Filter out shorts (less than or equal to 60 seconds)
        if (durationSec > 60 && !seenIds.has(vr.videoId)) {
            const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
            const channel = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || "";
            const description = vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map(r => r.text).join('') || vr.descriptionSnippet?.runs?.map(r => r.text).join('') || "";

            // Educational content eligibility check
            if (!isAllowedEducationalContent({ title, channel, description }).allowed) {
                return;
            }

            seenIds.add(vr.videoId);
            results.push({
                type: 'video',
                id: vr.videoId,
                title: title,
                channel: channel,
                description: description,
                thumbnail: vr.thumbnail?.thumbnails?.[vr.thumbnail?.thumbnails.length - 1]?.url || vr.thumbnail?.thumbnails?.[0]?.url || "",
                published_at: vr.publishedTimeText?.simpleText || "",
                url: `https://www.youtube.com/watch?v=${vr.videoId}`
            });
        }
    }

    // 2. Check for playlistRenderer (older style)
    if (item.playlistRenderer) {
        const pr = item.playlistRenderer;
        const count = parseInt(pr.videoCount) || 0;
        if (!seenIds.has(pr.playlistId)) {
            const title = pr.title?.simpleText || pr.title?.runs?.[0]?.text || "";
            const channel = pr.longBylineText?.runs?.[0]?.text || pr.shortBylineText?.runs?.[0]?.text || "";

            // Educational content eligibility check
            if (!isAllowedEducationalContent({ title, channel }).allowed) {
                return;
            }

            seenIds.add(pr.playlistId);
            results.push({
                type: 'playlist',
                id: pr.playlistId,
                title: title,
                channel: channel,
                description: "",
                thumbnail: pr.thumbnails?.[0]?.thumbnails?.[pr.thumbnails[0].thumbnails.length - 1]?.url || pr.thumbnails?.[0]?.thumbnails?.[0]?.url || "",
                published_at: "",
                url: `https://www.youtube.com/playlist?list=${pr.playlistId}`,
                video_count: count
            });
        }
    }

    // 3. Check for lockupViewModel
    if (item.lockupViewModel) {
        const vm = item.lockupViewModel;
        const contentType = vm.contentType;
        const contentId = vm.contentId;
        if (seenIds.has(contentId)) return;

        const title = vm.metadata?.lockupMetadataViewModel?.title?.content || "";
        
        // Get channel name
        let channel = "";
        const rows = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
        if (rows && rows.length > 0) {
            const parts = rows[0].metadataParts;
            if (parts && parts.length > 0) {
                channel = parts[0].text?.content || "";
            }
        }

        // Educational content eligibility check
        if (!isAllowedEducationalContent({ title, channel }).allowed) {
            return;
        }

        // Get thumbnail
        let thumbnail = "";
        if (vm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources) {
            const sources = vm.contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.image.sources;
            thumbnail = sources[sources.length - 1]?.url || "";
        } else if (vm.contentImage?.thumbnailViewModel?.image?.sources) {
            const sources = vm.contentImage.thumbnailViewModel.image.sources;
            thumbnail = sources[sources.length - 1]?.url || "";
        }

        if (contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') {
            let videoCount = 0;
            const overlays = vm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.overlays;
            if (overlays) {
                for (const overlay of overlays) {
                    const badges = overlay.thumbnailOverlayBadgeViewModel?.thumbnailBadges;
                    if (badges) {
                        for (const badge of badges) {
                            const badgeText = badge.thumbnailBadgeViewModel?.text || "";
                            const match = badgeText.match(/\d+/);
                            if (match) {
                                videoCount = parseInt(match[0]) || 0;
                                break;
                            }
                        }
                    }
                    if (videoCount > 0) break;
                }
            }

            seenIds.add(contentId);
            results.push({
                type: 'playlist',
                id: contentId,
                title: title,
                channel: channel,
                description: "",
                thumbnail: thumbnail,
                published_at: "",
                url: `https://www.youtube.com/playlist?list=${contentId}`,
                video_count: videoCount
            });
        } else if (contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
            let durationText = "";
            const overlays = vm.contentImage?.thumbnailViewModel?.overlays;
            if (overlays) {
                for (const overlay of overlays) {
                    if (overlay.thumbnailOverlayTimeStatusRenderer) {
                        durationText = overlay.thumbnailOverlayTimeStatusRenderer.text || "";
                        break;
                    }
                }
            }
            const durationSec = parseDurationText(durationText);
            if (durationSec > 60) {
                seenIds.add(contentId);
                results.push({
                    type: 'video',
                    id: contentId,
                    title: title,
                    channel: channel,
                    description: "",
                    thumbnail: thumbnail,
                    published_at: "",
                    url: `https://www.youtube.com/watch?v=${contentId}`
                });
            }
        }
    }
};

const https = require('https');
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

/**
 * Search YouTube for videos and playlists (Fast Innertube + Fallback)
 */
const searchYoutube = async (query, maxResults = 50, optionsOrType = {}, order = 'relevance') => {
    let options = {};
    if (typeof optionsOrType === 'string') {
        options = {
            type: optionsOrType === 'video,playlist' ? 'all' : optionsOrType,
            sortBy: order === 'viewCount' ? 'views' : 'relevance',
            duration: 'any'
        };
    } else {
        options = optionsOrType;
    }

    const { type = 'all', sortBy = 'relevance', duration = 'any' } = options;

    const getSpParam = (t, s, d) => {
        if (t === 'playlist') {
            if (s === 'date') return 'CAISAhAD';
            if (s === 'views') return 'CAMSAhAD';
            return 'EgIQAw%3D%3D';
        }
        if (t === 'video') {
            if (s === 'date') {
                if (d === 'short') return 'CAISBBABGAE%3D';
                if (d === 'medium') return 'CAISBBABGAI%3D';
                if (d === 'long') return 'CAISBBABGAM%3D';
                return 'CAISAhAB';
            }
            if (s === 'views') {
                if (d === 'short') return 'CAMSBBABGAE%3D';
                if (d === 'medium') return 'CAMSBBABGAI%3D';
                if (d === 'long') return 'CAMSBBABGAM%3D';
                return 'CAMSAhAB';
            }
            if (d === 'short') return 'EgQQARgB';
            if (d === 'medium') return 'EgQQARgC';
            if (d === 'long') return 'EgQQARgD';
            return 'EgIQAQ%3D%3D';
        }
        if (s === 'date') return 'CAI%3D';
        if (s === 'views') return 'CAM%3D';
        return '';
    };

    const sp = getSpParam(type, sortBy, duration);

    // Fast Path: Innertube Direct JSON API
    try {
        const payload = {
            context: {
                client: {
                    clientName: 'WEB',
                    clientVersion: '2.20240101.00.00',
                    hl: 'en',
                    gl: 'US'
                }
            },
            query: query
        };
        if (sp) payload.params = sp;

        const res = await axios.post('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', payload, {
            httpsAgent,
            headers: { 'Content-Type': 'application/json' },
            timeout: 3500
        });

        const contents = res.data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        const results = [];
        const seenIds = new Set();
        let continuationToken = null;

        if (contents && Array.isArray(contents)) {
            contents.forEach(section => {
                if (section.itemSectionRenderer?.contents) {
                    section.itemSectionRenderer.contents.forEach(item => parseRawItem(item, results, seenIds));
                }
                if (section.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
                    continuationToken = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                }
            });
        }

        // Fetch 1 fast continuation if available and results count < 35
        if (continuationToken && results.length < 35) {
            try {
                const contRes = await axios.post('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
                    context: {
                        client: {
                            clientName: 'WEB',
                            clientVersion: '2.20240101.00.00',
                            hl: 'en',
                            gl: 'US'
                        }
                    },
                    continuation: continuationToken
                }, {
                    httpsAgent,
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 2500
                });

                const nextActions = contRes.data?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems;
                if (nextActions && Array.isArray(nextActions)) {
                    nextActions.forEach(c => {
                        if (c.itemSectionRenderer?.contents) {
                            c.itemSectionRenderer.contents.forEach(item => parseRawItem(item, results, seenIds));
                        }
                    });
                }
            } catch (contErr) {
                // Continue with initial results on timeout
            }
        }

        if (results.length > 0) {
            const sliced = maxResults ? results.slice(0, maxResults) : results;
            return { results: sliced };
        }
    } catch (innertubeErr) {
        console.warn('Innertube search error, falling back to HTML:', innertubeErr.message);
    }

    // Fallback: HTML page scraping
    try {
        let endpoint = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        if (sp) endpoint += `&sp=${sp}`;

        const page = await axios.get(endpoint, {
            httpsAgent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
        });
        const ytInitData = page.data.split('var ytInitialData =');
        if (!ytInitData || ytInitData.length <= 1) {
            return { error: 'Failed to parse YouTube page data' };
        }

        const dataStr = ytInitData[1].split('</script>')[0].trim();
        const cleanedData = dataStr.endsWith(';') ? dataStr.slice(0, -1) : dataStr;
        const initdata = JSON.parse(cleanedData);

        const contents = initdata.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        if (!contents) {
            return { results: [] };
        }

        const results = [];
        const seenIds = new Set();
        contents.forEach(section => {
            if (section.itemSectionRenderer?.contents) {
                section.itemSectionRenderer.contents.forEach(item => parseRawItem(item, results, seenIds));
            }
        });

        const slicedResults = maxResults ? results.slice(0, maxResults) : results;
        return { results: slicedResults };
    } catch (error) {
        return { error: `Search API Error: ${error.message}` };
    }
};

module.exports = {
    getYoutubeMetadata,
    searchYoutube,
    extractId,
};
