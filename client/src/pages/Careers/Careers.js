import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Code, 
  Palette, 
  BarChart3,
  Heart,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle,
  Star
} from 'lucide-react';

const Careers = () => {
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance, mental health support, and wellness programs'
    },
    {
      icon: Zap,
      title: 'Flexible Work',
      description: 'Remote work options, flexible hours, and work-life balance initiatives'
    },
    {
      icon: Shield,
      title: 'Learning & Growth',
      description: 'Professional development budget, conferences, and skill-building opportunities'
    },
    {
      icon: Globe,
      title: 'Global Impact',
      description: 'Work on products that impact millions of users worldwide'
    }
  ];

  const values = [
    {
      title: 'Innovation First',
      description: 'We encourage creative thinking and embrace new technologies'
    },
    {
      title: 'Collaboration',
      description: 'We believe in the power of teamwork and diverse perspectives'
    },
    {
      title: 'User-Centric',
      description: 'Everything we do is focused on creating value for our users'
    },
    {
      title: 'Growth Mindset',
      description: 'We invest in our people and their continuous development'
    }
  ];

  const openPositions = [
    {
      id: 1,
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Remote / Dehradun',
      type: 'Full-time',
      experience: '3-5 years',
      description: 'Join our engineering team to build scalable, secure, and innovative event management solutions.',
      requirements: [
        'Strong experience with React, Node.js, and MongoDB',
        'Experience with cloud platforms (AWS/Azure)',
        'Knowledge of microservices architecture',
        'Experience with payment integration and security'
      ],
      responsibilities: [
        'Develop and maintain our core platform',
        'Collaborate with cross-functional teams',
        'Implement security best practices',
        'Mentor junior developers'
      ]
    },
    {
      id: 2,
      title: 'AI/ML Engineer',
      department: 'Engineering',
      location: 'Remote / Dehradun',
      type: 'Full-time',
      experience: '2-4 years',
      description: 'Work on cutting-edge face recognition and AI technologies to enhance our platform.',
      requirements: [
        'Experience with computer vision and deep learning',
        'Proficiency in Python, TensorFlow/PyTorch',
        'Experience with face recognition systems',
        'Knowledge of OpenCV and image processing'
      ],
      responsibilities: [
        'Develop and optimize face recognition algorithms',
        'Implement real-time processing systems',
        'Work on model training and deployment',
        'Collaborate with product team on AI features'
      ]
    },
    {
      id: 3,
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote / Dehradun',
      type: 'Full-time',
      experience: '2-4 years',
      description: 'Create intuitive and beautiful user experiences for our event management platform.',
      requirements: [
        'Strong portfolio in web and mobile design',
        'Proficiency in Figma, Adobe Creative Suite',
        'Experience with user research and testing',
        'Knowledge of design systems and accessibility'
      ],
      responsibilities: [
        'Design user interfaces and experiences',
        'Conduct user research and usability testing',
        'Create design systems and guidelines',
        'Collaborate with engineering and product teams'
      ]
    },
    {
      id: 4,
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote / Dehradun',
      type: 'Full-time',
      experience: '2-4 years',
      description: 'Build and maintain our infrastructure to ensure high availability and performance.',
      requirements: [
        'Experience with AWS/Azure cloud platforms',
        'Knowledge of Docker, Kubernetes',
        'Experience with CI/CD pipelines',
        'Monitoring and logging tools (Prometheus, Grafana)'
      ],
      responsibilities: [
        'Manage cloud infrastructure and deployments',
        'Implement monitoring and alerting systems',
        'Ensure security and compliance',
        'Optimize performance and costs'
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Senior Developer',
      content: 'Working at Eventra has been incredible. The team is supportive, the work is challenging, and I get to work on cutting-edge technology that makes a real difference.',
      avatar: '/api/placeholder/60/60'
    },
    {
      name: 'Mike Chen',
      role: 'Product Designer',
      content: 'The culture here is amazing. Everyone is passionate about what they do, and there\'s always room to learn and grow. Plus, the remote work flexibility is perfect.',
      avatar: '/api/placeholder/60/60'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Join Our <span className="text-cyan-400">Team</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Be part of a team that's revolutionizing event management. Work on cutting-edge technology, 
              solve complex problems, and make a real impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                View Open Positions
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cyan-600 transition-colors">
                Learn About Our Culture
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Why Work With Us */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Why Work With Us?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're building the future of event management, and we need passionate people to join us on this journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-gray-700 rounded-xl p-6 text-center hover:bg-gray-600 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-full mb-4">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-300">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Our Values</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              These values guide everything we do and shape our company culture.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-gray-300">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Open Positions</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join our team and help us build the future of event management.
            </p>
          </motion.div>

          <div className="space-y-6">
            {openPositions.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-gray-700 rounded-xl p-6 hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-4">
                      <span className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {job.department}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.type}
                      </span>
                      <span>{job.experience}</span>
                    </div>
                    <p className="text-gray-300">{job.description}</p>
                  </div>
                  <button className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>

                {selectedJob === job.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 pt-6 border-t border-gray-600"
                  >
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Requirements</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, reqIndex) => (
                            <li key={reqIndex} className="flex items-start text-gray-300">
                              <CheckCircle className="h-4 w-4 text-cyan-400 mr-2 mt-1 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Responsibilities</h4>
                        <ul className="space-y-2">
                          {job.responsibilities.map((resp, respIndex) => (
                            <li key={respIndex} className="flex items-start text-gray-300">
                              <CheckCircle className="h-4 w-4 text-cyan-400 mr-2 mt-1 flex-shrink-0" />
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">What Our Team Says</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Hear from our team members about their experience working at Eventra.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-8"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-cyan-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.content}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Join Our Team?
            </h2>
            <p className="text-xl text-cyan-100 mb-8 max-w-3xl mx-auto">
              Don't see a position that fits? We're always looking for talented people. 
              Send us your resume and let's start a conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-white text-cyan-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                View All Positions
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cyan-600 transition-colors">
                Send Resume
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Careers;
