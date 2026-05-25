"use client";

import Image from "next/image";
import { Calendar, Eye, PlayCircle } from "lucide-react";
import { useState } from "react";

export default function VideoCard({ video }) {
  const [playing, setPlaying] = useState(false);
  const embed = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`;

  return (
    <article className="youtube-card">
      {playing ? (
        <div className="video-container active">
          <iframe src={embed} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      ) : (
        <button className="youtube-thumbnail" onClick={() => setPlaying(true)}>
          <Image src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`} alt={video.title} fill />
          <PlayCircle className="play-button" size={56} />
        </button>
      )}
      <div className="video-info">
        <h3>{video.title}</h3>
        <p>{video.speaker}</p>
        <div className="video-stats">
          <span><Eye size={15} /> {video.views}</span>
          <span><Calendar size={15} /> حديثا</span>
        </div>
      </div>
    </article>
  );
}
