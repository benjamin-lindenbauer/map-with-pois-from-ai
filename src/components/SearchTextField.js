import { TextField, IconButton, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';

const SearchTextField = ({ 
  value, 
  onChange, 
  onEnterPress, 
  placeholder, 
  multiline = false, 
  rows = 1,
  requireCtrl = false,
  type,
  submitIcon = 'search'
}) => {
  const handleKeyDown = (e) => {
    if (onEnterPress && e.key === 'Enter' && (!requireCtrl || (requireCtrl && e.ctrlKey))) {
      e.preventDefault();
      onEnterPress(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onEnterPress) {
      onEnterPress(value);
    }
  };

  const handleClear = () => {
    onChange({ target: { value: '' } });
  };

  const getIcon = () => {
    switch (submitIcon) {
      case 'save':
        return <SaveIcon />;
      case 'key':
        return <KeyIcon />;
      case 'search':
      default:
        return <SearchIcon />;
    }
  };

  const inputType = type === 'search' ? 'text' : type;

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        type={inputType}
        InputProps={{
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear input"
                onClick={handleClear}
                edge="end"
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          enterKeyHint: 'search',
          'aria-label': placeholder,
        }}
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
      <IconButton 
        type="submit" 
        aria-label={submitIcon === 'key' ? 'submit api key' : submitIcon === 'save' ? 'save' : 'search'}
        sx={{
          backgroundColor: 'white',
          '&:hover': {
            backgroundColor: '#f5f5f5'
          }
        }}
      >
        {getIcon()}
      </IconButton>
    </form>
  );
};

export default SearchTextField;
