import { TextField } from '@mui/material';

const SearchTextField = ({ 
  value, 
  onChange, 
  onEnterPress, 
  placeholder, 
  multiline = false, 
  rows = 1,
  requireCtrl = false,
  type
}) => {
  const handleKeyDown = (e) => {
    if (onEnterPress && e.key === 'Enter' && (!requireCtrl || (requireCtrl && e.ctrlKey))) {
      onEnterPress(value);
    }
  };

  return (
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      multiline={multiline}
      rows={rows}
      type={type}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          borderRadius: '8px',
          '& fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.23)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.87)',
          },
        }
      }}
    />
  );
};

export default SearchTextField;
