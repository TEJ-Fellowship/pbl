const benefits = [
    { title: "Automated Moderation", desc: "Keep your community safe 24/7 with intelligent, customizable auto-moderation. Say goodbye to spam and rule-breakers." },
    { title: "Instant Support", desc: "Our AI agent instantly answers common questions, freeing up your team to handle more complex issues." },
    { title: "Community Insights", desc: "Gain valuable insights into your server's health and member activity with powerful analytics and reports." },
  ];
  
  const KeyBenefits = () => {
    return (
      <section className="grid md:grid-cols-3 gap-6 px-4 mb-12 text-center">
        {benefits.map((b, i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition">
            <h3 className="text-xl font-semibold mb-2">{b.title}</h3>
            <p className="text-gray-400">{b.desc}</p>
          </div>
        ))}
      </section>
    );
  };
  
  export default KeyBenefits;
  