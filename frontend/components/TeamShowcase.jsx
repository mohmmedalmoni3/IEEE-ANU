"use client";

import { apiGet } from "@/lib/api";
import { ExternalLink, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TeamShowcase() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const data = await apiGet("/team-members");
      setMembers(data.members || []);
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || members.length === 0) return null;

  // Duplicate members multiple times for seamless scrolling
  const duplicatedMembers = [...members, ...members, ...members, ...members];

  return (
    <section className="team-showcase-section">
      <div className="team-showcase-header">
        <Users size={28} />
        <h2>فريق IEEE ANU</h2>
      </div>
      
      <div className="team-marquee-container">
        <div className="team-marquee">
          {duplicatedMembers.map((member, index) => (
            <div className="team-member-card" key={`${member.id}-${index}`}>
              <div className="team-member-image">
                {member.imageUrl ? (
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="team-member-placeholder">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="team-member-info">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                {member.portfolioUrl && (
                  <Link 
                    href={member.portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="team-portfolio-link"
                  >
                    <ExternalLink size={14} />
                    <span>تعرف علي</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
