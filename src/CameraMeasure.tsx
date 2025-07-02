import React, { useEffect, useRef } from 'react'

const CameraMeasure = () => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    }).catch(err => {
      console.error('Erreur accès caméra :', err)
    })
  }, [])

  return (
    <div style={{ backgroundColor: 'black', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <video ref={videoRef} autoPlay style={{ width: '90%', maxHeight: '90%' }} />
    </div>
  )
}

export default CameraMeasure
