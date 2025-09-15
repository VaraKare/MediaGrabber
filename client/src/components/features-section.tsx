export default function FeaturesSection() {
  const features = [
    {
      icon: "fas fa-bolt",
      title: "Lightning Fast",
      description: "High-speed downloads with optimized servers for the best experience.",
      color: "primary"
    },
    {
      icon: "fas fa-shield-alt",
      title: "Safe & Secure", 
      description: "No malware, no suspicious downloads. Just clean, safe media files.",
      color: "secondary"
    },
    {
      icon: "fas fa-heart",
      title: "Social Impact",
      description: "Premium downloads contribute to charitable causes automatically.",
      color: "accent"
    }
  ];

  return (
    <section className="py-16 bg-card" id="features" data-testid="features-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Why Choose MediaHub?</h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fast, reliable downloads with a purpose. Every premium download helps make a difference.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center" data-testid={`feature-${index + 1}`}>
              <div className={`bg-${feature.color}/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                <i className={`${feature.icon} text-${feature.color} text-xl`}></i>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
