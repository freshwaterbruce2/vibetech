import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import type { HotelImage } from '@/types/liteapi'

interface ImageGalleryProps {
  images: HotelImage[]
  hotelName: string
}

interface ImageModalProps {
  images: HotelImage[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

const ImageModal: React.FC<ImageModalProps> = ({ images, currentIndex, onClose, onIndexChange }) => {
  const goToPrevious = () => {
    onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
        onClick={goToPrevious}
        disabled={images.length <= 1}
      >
        <ChevronLeft className="w-8 h-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
        onClick={goToNext}
        disabled={images.length <= 1}
      >
        <ChevronRight className="w-8 h-8" />
      </Button>

      <div className="max-w-7xl max-h-full mx-4">
        <img
          src={images[currentIndex]?.url}
          alt={images[currentIndex]?.caption || `Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
        {images[currentIndex]?.caption && (
          <p className="text-white text-center mt-4 text-lg">
            {images[currentIndex].caption}
          </p>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => onIndexChange(index)}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, hotelName }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Grid3x3 className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    )
  }

  const mainImage = images[0]
  const thumbnailImages = images.slice(1, 5) // Show up to 4 additional thumbnails

  const openModal = (index: number) => {
    setSelectedImageIndex(index)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 h-96">
        {/* Main Image */}
        <div className="lg:col-span-3 relative group cursor-pointer" onClick={() => openModal(0)}>
          <img
            src={mainImage.url}
            alt={mainImage.caption || `${hotelName} main view`}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          {mainImage.caption && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
              {mainImage.caption}
            </div>
          )}
        </div>

        {/* Thumbnail Grid */}
        <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-2">
          {thumbnailImages.map((image, index) => {
            const actualIndex = index + 1
            return (
              <div
                key={actualIndex}
                className="relative group cursor-pointer"
                onClick={() => openModal(actualIndex)}
              >
                <img
                  src={image.url}
                  alt={image.caption || `${hotelName} view ${actualIndex + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            )
          })}

          {/* View All Photos Button */}
          {images.length > 5 && (
            <div
              className="relative group cursor-pointer bg-gray-100 rounded-lg flex items-center justify-center"
              onClick={() => openModal(0)}
            >
              <div className="text-center">
                <Grid3x3 className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                <span className="text-sm text-gray-600">+{images.length - 4} more</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View All Photos Button */}
      <div className="mt-4 text-center">
        <Button variant="outline" onClick={() => openModal(0)} className="inline-flex items-center gap-2">
          <Grid3x3 className="w-4 h-4" />
          View all {images.length} photos
        </Button>
      </div>

      {/* Image Modal */}
      {isModalOpen && (
        <ImageModal
          images={images}
          currentIndex={selectedImageIndex}
          onClose={() => setIsModalOpen(false)}
          onIndexChange={setSelectedImageIndex}
        />
      )}
    </>
  )
}

export default ImageGallery