import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, ${props => props.theme.border} 25%, ${props => props.theme.surface} 50%, ${props => props.theme.border} 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: 4px;
`;

const SkeletonText = styled(SkeletonBase)<{ width?: string; height?: string }>`
  height: ${props => props.height || '16px'};
  width: ${props => props.width || '100%'};
  margin-bottom: 8px;
`;

const SkeletonCard = styled(SkeletonBase)`
  height: 120px;
  width: 100%;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const SkeletonAvatar = styled(SkeletonBase)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
`;

const SkeletonButton = styled(SkeletonBase)`
  height: 36px;
  width: 100px;
  border-radius: 8px;
`;

interface LoadingSkeletonProps {
  type: 'text' | 'card' | 'avatar' | 'button';
  width?: string;
  height?: string;
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type, 
  width, 
  height, 
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return <SkeletonText width={width} height={height} />;
      case 'card':
        return <SkeletonCard style={{ height }} />;
      case 'avatar':
        return <SkeletonAvatar />;
      case 'button':
        return <SkeletonButton style={{ width, height }} />;
      default:
        return <SkeletonText width={width} height={height} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default LoadingSkeleton;