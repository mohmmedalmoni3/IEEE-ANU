"use client";

import { apiGet } from "@/lib/api";
import { Users } from "lucide-react";
import Image from "next/image";
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

  return (
    <section className="team-showcase-section">
      <div className="team-showcase-header">
        <Users size={28} />
        <h2>فريق IEEE ANU</h2>
      </div>
      
      <div className="team-marquee-container">
        <div className="team-marquee">
          {members.map((member) => (
            <div className="team-member-card" key={member.id}>
              <div className="team-member-image">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 100px, 150px"
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
              </div>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {members.map((member) => (
            <div className="team-member-card" key={`${member.id}-duplicate`}>
              <div className="team-member-image">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 100px, 150px"
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
