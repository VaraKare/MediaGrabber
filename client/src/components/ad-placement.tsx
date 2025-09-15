export default function AdPlacement() {
  return (
    <section className="py-8" data-testid="ad-placement">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Content would go here */}
          </div>
          
          {/* Sidebar Ad Space */}
          <div className="lg:col-span-1">
            <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-6 text-center" data-testid="ad-sidebar">
              <i className="fas fa-ad text-muted-foreground text-3xl mb-3"></i>
              <p className="text-muted-foreground text-sm">Advertisement Space</p>
              <p className="text-xs text-muted-foreground mt-1">300x250 Banner</p>
            </div>
          </div>
        </div>
        
        {/* Bottom Banner Ad */}
        <div className="mt-8">
          <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-4 text-center" data-testid="ad-bottom">
            <p className="text-muted-foreground text-sm">728x90 Bottom Banner Advertisement</p>
          </div>
        </div>
      </div>
    </section>
  );
}
