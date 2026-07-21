export interface BaseStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export interface ErrorStateProps extends BaseStateProps {
  error?: Error | unknown;
  retry?: () => void;
}
