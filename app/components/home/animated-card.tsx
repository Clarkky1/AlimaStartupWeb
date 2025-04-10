"use client"

import React from 'react'
import Image from 'next/image'

export function AnimatedCard() {
  return (
    <div className="animated-card-wrapper">
      <div className="card">
        <div className="border"></div>
        <div className="content">
          <div className="logo">
            <div className="logo1">
              <Image 
                src="/AlimaLOGO.svg" 
                alt="Alima Logo" 
                width={33} 
                height={33} 
                className="logo-image"
              />
            </div>
            <div className="logo2">
              <span className="alima-text">ALIMA</span>
            </div>
            <span className="trail"></span>
          </div>
          <span className="logo-bottom-text">ALIMA</span>
        </div>
        <span className="bottom-text">connect & serve</span>
      </div>

      <style jsx>{`
        .animated-card-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 30px;
        }
        
        .card {
          width: 250px;
          height: 180px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          position: relative;
          display: grid;
          place-content: center;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.5s ease-in-out;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo-image {
          height: 100%;
          width: auto;
          filter: none;
          display: block;
          object-fit: contain;
          transform: translateZ(0);
        }

        .alima-text {
          font-size: 24px;
          font-weight: bold;
          color: white;
          letter-spacing: 1px;
          filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.3));
        }

        .border {
          position: absolute;
          inset: 0px;
          border: 2px solid #3b82f6;
          opacity: 0;
          transform: rotate(10deg);
          transition: all 0.5s ease-in-out;
        }

        .bottom-text {
          position: absolute;
          left: 50%;
          bottom: 13px;
          transform: translateX(-50%);
          font-size: 8px;
          text-transform: uppercase;
          padding: 0px 5px 0px 8px;
          color: transparent;
          background: rgba(255, 255, 255, 0.15);
          opacity: 0;
          letter-spacing: 7px;
          transition: opacity 0.8s ease-in-out, letter-spacing 1s ease-in-out, transform 0.5s ease-in-out;
          background-image: linear-gradient(90deg, #3b82f6, #10b981);
          -webkit-background-clip: text;
          background-clip: text;
          font-weight: bold;
        }

        .content {
          transition: all 0.5s ease-in-out;
        }

        .content .logo {
          height: 35px;
          position: relative;
          width: 33px;
          overflow: hidden;
          transition: all 1s ease-in-out;
        }

        .content .logo .logo1 {
          height: 33px;
          width: 33px;
          position: absolute;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .content .logo .logo2 {
          height: 33px;
          position: absolute;
          left: 33px;
          display: flex;
          align-items: center;
        }

        .content .logo .trail {
          position: absolute;
          right: 0;
          height: 100%;
          width: 100%;
          opacity: 0;
        }

        .content .logo-bottom-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          margin-top: 30px;
          color: white;
          padding-left: 8px;
          font-size: 11px;
          opacity: 0;
          font-weight: bold;
          letter-spacing: none;
          transition: all 0.5s ease-in-out 0.5s;
        }

        .card:hover {
          border-radius: 0;
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }

        .card:hover .logo {
          width: 134px;
          animation: opacity 1s ease-in-out;
        }

        .card:hover .border {
          inset: 15px;
          opacity: 1;
          transform: rotate(0);
        }

        .card:hover .bottom-text {
          letter-spacing: 3px;
          opacity: 1;
          transform: translateX(-50%);
          transition: opacity 0.8s ease-in-out 0.2s, letter-spacing 1s ease-in-out, transform 0.5s ease-in-out;
        }

        .card:hover .content .logo-bottom-text {
          opacity: 1;
          letter-spacing: 9.5px;
        }

        .card:hover .trail {
          animation: trail 1s ease-in-out;
        }

        @keyframes opacity {
          0% {
            border-right: 1px solid transparent;
          }

          10% {
            border-right: 1px solid #3b82f6;
          }

          80% {
            border-right: 1px solid #3b82f6;
          }

          100% {
            border-right: 1px solid transparent;
          }
        }

        @keyframes trail {
          0% {
            background: linear-gradient(90deg, rgba(59, 130, 246, 0) 90%, rgba(59, 130, 246, 1) 100%);
            opacity: 0;
          }

          30% {
            background: linear-gradient(90deg, rgba(59, 130, 246, 0) 70%, rgba(59, 130, 246, 1) 100%);
            opacity: 1;
          }

          70% {
            background: linear-gradient(90deg, rgba(59, 130, 246, 0) 70%, rgba(59, 130, 246, 1) 100%);
            opacity: 1;
          }

          95% {
            background: linear-gradient(90deg, rgba(59, 130, 246, 0) 90%, rgba(59, 130, 246, 1) 100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
} 