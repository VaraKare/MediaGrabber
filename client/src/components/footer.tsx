export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="gradient-bg p-2 rounded-lg">
                <i className="fas fa-download text-primary-foreground"></i>
              </div>
              <span className="text-xl font-bold">MediaHub</span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Download media while making a positive impact on the world.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="/youtube-downloader" className="hover:text-primary-foreground transition-colors" data-testid="link-youtube">YouTube Downloader</a></li>
              <li><a href="/instagram-downloader" className="hover:text-primary-foreground transition-colors" data-testid="link-instagram">Instagram Downloader</a></li>
              <li><a href="/twitter-downloader" className="hover:text-primary-foreground transition-colors" data-testid="link-twitter">Twitter Downloader</a></li>
              <li><a href="/tiktok-downloader" className="hover:text-primary-foreground transition-colors" data-testid="link-tiktok">TikTok Downloader</a></li>
              <li><a href="/facebook-downloader" className="hover:text-primary-foreground transition-colors" data-testid="link-facebook">Facebook Downloader</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Charity</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-impact">Impact Reports</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-history">Donation History</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-transparency">Transparency</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-partners">Partner Charities</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-terms">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-dmca">DMCA Policy</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors" data-testid="link-copyright">Copyright</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/70">
          <p>&copy; 2024 MediaHub. All rights reserved. Built with ❤️ for social impact.</p>
        </div>
      </div>
    </footer>
  );
}
