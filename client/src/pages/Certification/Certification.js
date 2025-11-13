import React from 'react';
import { Award, CheckCircle, Star, Users, Clock, Globe } from 'lucide-react';

const Certification = () => {
  const certifications = [
    {
      id: 1,
      title: "Event Management Professional",
      description: "Master the art of planning, organizing, and executing successful events with our comprehensive certification program.",
      duration: "6 months",
      level: "Professional",
      features: [
        "Event Planning Fundamentals",
        "Budget Management",
        "Vendor Relations",
        "Risk Assessment",
        "Digital Marketing for Events",
        "Post-Event Analysis"
      ],
      price: "$299",
      badge: "EMP"
    },
    {
      id: 2,
      title: "Advanced Event Technology Specialist",
      description: "Learn cutting-edge event technologies including AI, VR, and digital platforms for modern event management.",
      duration: "4 months",
      level: "Advanced",
      features: [
        "Virtual Reality Events",
        "AI-Powered Attendee Management",
        "Live Streaming Technologies",
        "Mobile Event Apps",
        "Data Analytics",
        "Integration Platforms"
      ],
      price: "$399",
      badge: "AETS"
    },
    {
      id: 3,
      title: "Sustainable Event Management",
      description: "Lead the green revolution in event management with sustainable practices and eco-friendly solutions.",
      duration: "3 months",
      level: "Specialist",
      features: [
        "Green Event Planning",
        "Carbon Footprint Reduction",
        "Sustainable Vendor Selection",
        "Waste Management",
        "Renewable Energy Solutions",
        "Environmental Impact Assessment"
      ],
      price: "$249",
      badge: "SEM"
    }
  ];

  const benefits = [
    {
      icon: <Award className="h-8 w-8 text-yellow-500" />,
      title: "Industry Recognition",
      description: "Get recognized by top event management companies worldwide"
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Professional Network",
      description: "Connect with industry experts and fellow professionals"
    },
    {
      icon: <Star className="h-8 w-8 text-purple-500" />,
      title: "Career Advancement",
      description: "Boost your career with certified skills and knowledge"
    },
    {
      icon: <Globe className="h-8 w-8 text-green-500" />,
      title: "Global Opportunities",
      description: "Access international job opportunities and projects"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Professional <span className="text-yellow-400">Certification</span> Programs
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Advance your career in event management with our industry-recognized certification programs. 
              Learn from experts and gain the skills needed to excel in the dynamic world of events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg transition-colors">
                View All Programs
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-black font-bold py-3 px-8 rounded-lg transition-colors">
                Download Brochure
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Certifications?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our certification programs are designed by industry experts to provide you with practical, 
              real-world skills that employers value.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certification Programs */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Certification Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our comprehensive range of certification programs designed for different skill levels and career goals.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {certifications.map((cert) => (
              <div key={cert.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {cert.badge}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {cert.price}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {cert.title}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {cert.description}
                </p>
                
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{cert.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{cert.level}</span>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-8">
                  {cert.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Certification Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who have advanced their careers with our certification programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors">
              Get Started Today
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-3 px-8 rounded-lg transition-colors">
              Speak to an Advisor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certification;
