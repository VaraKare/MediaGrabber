# Website Flow

This document outlines the user flow for the MediaGrabber application.

1.  **Visit Website:** The user navigates to the MediaGrabber website.
2.  **Paste URL:** The user pastes a URL of a video from a supported platform into the input field on the homepage.
3.  **Initiate Download Analysis:** The user clicks the "Download" button.
4.  **Backend Processing:** The frontend sends the URL to the backend API. The backend uses `yt-dlp` to fetch video information, including available formats, quality levels, and thumbnails.
5.  **Display Options:** The backend returns the video information to the frontend. The frontend then displays the various download options to the user.
6.  **Ad-Supported Downloads:** For video quality options below 480p, the user will be required to wait for 15 seconds (watching an ad) before the download can begin.
7.  **Select Quality:** The user selects their desired video quality and format from the list of options.
8.  **Start Download:** The user clicks the "Download" button corresponding to their selected option.
9.  **File Download:** The frontend opens a new tab or initiates a download directly from a dedicated backend endpoint, which streams the video file to the user.
10. **Analytics:** An anonymous record of the download event is created to track statistics for charity donations. No personal user data is stored.
