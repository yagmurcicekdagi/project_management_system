import PropTypes from "prop-types";

export const projectShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string,
  description: PropTypes.string,
  dueDate: PropTypes.string,
  endDate: PropTypes.string,
  startDate: PropTypes.string,
  createdAt: PropTypes.string,
  progress: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  completion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});
