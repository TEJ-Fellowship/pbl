import { ShieldCheck, BarChart3 } from "lucide-react";
import { PiChatTeardropTextFill } from "react-icons/pi";
import { MdInsights } from "react-icons/md";

const benefits = [
    { title: "Automated Moderation", desc: "Keep your community safe 24/7 with intelligent, customizable auto-moderation. Say goodbye to spam and rule-breakers.", icon: ShieldCheck },
    { title: "Instant Support", desc: "Our AI agent instantly answers common questions, freeing up your team to handle more complex issues.", icon: PiChatTeardropTextFill },
    { title: "Community Insights", desc: "Gain valuable insights into your server's health and member activity with powerful analytics and reports.", icon: MdInsights },
  ];
  
  const KeyBenefits = () => {
    return (
      <section className="relative px-4 md:px-8 mb-20 mt-20">
        <h2 className="sr-only">Key Benefits</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-10 transition-all duration-400 hover:-translate-y-2.5 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/30 group overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/50">
                  {b.icon ? <b.icon size={32} className="text-white" /> : null}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{b.title}</h3>
                <p className="text-gray-300 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  export default KeyBenefits;
  