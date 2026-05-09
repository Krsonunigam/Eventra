# Custom Toast System

This custom toast system replaces the default browser toast notifications with centered, styled toasts that appear in the middle of the webpage.

## Features

- **Centered positioning**: Toasts appear in the center of the screen
- **Custom styling**: Beautiful, themed toast notifications
- **CRUD operations**: Pre-built toast methods for Create, Read, Update, Delete operations
- **Authentication toasts**: Login, logout, registration success/error messages
- **Event management**: Event creation, update, deletion notifications
- **Payment processing**: Payment success/error with loading states
- **Auto-dismiss**: Configurable auto-dismiss timing
- **Manual dismiss**: Click to close toasts manually

## Usage

### Basic Usage

```jsx
import useCustomToast from '../../utils/customToast';

const MyComponent = () => {
  const toast = useCustomToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
};
```

### CRUD Operations

```jsx
const handleCreate = async () => {
  try {
    await createItem(data);
    toast.createSuccess('Item created successfully!');
  } catch (error) {
    toast.createError('Failed to create item');
  }
};

const handleUpdate = async () => {
  try {
    await updateItem(id, data);
    toast.updateSuccess('Item updated successfully!');
  } catch (error) {
    toast.updateError('Failed to update item');
  }
};

const handleDelete = async () => {
  try {
    await deleteItem(id);
    toast.deleteSuccess('Item deleted successfully!');
  } catch (error) {
    toast.deleteError('Failed to delete item');
  }
};
```

### Authentication Operations

```jsx
const handleLogin = async () => {
  try {
    await login(credentials);
    toast.loginSuccess('Welcome back!');
  } catch (error) {
    toast.loginError('Login failed. Please try again.');
  }
};

const handleRegister = async () => {
  try {
    await register(userData);
    toast.registerSuccess('Account created successfully!');
  } catch (error) {
    toast.registerError('Registration failed. Please try again.');
  }
};
```

### Event Operations

```jsx
const handleEventCreate = async () => {
  try {
    await createEvent(eventData);
    toast.eventCreateSuccess('Event created successfully!');
  } catch (error) {
    toast.eventCreateError('Failed to create event');
  }
};
```

### Payment Operations

```jsx
const handlePayment = async () => {
  const loadingId = toast.paymentProcessing('Processing payment...');
  
  try {
    await processPayment(paymentData);
    toast.dismiss(loadingId);
    toast.paymentSuccess('Payment completed successfully!');
  } catch (error) {
    toast.dismiss(loadingId);
    toast.paymentError('Payment failed. Please try again.');
  }
};
```

### Loading States

```jsx
const handleAsyncOperation = async () => {
  const loadingId = toast.loading('Processing...');
  
  try {
    await someAsyncOperation();
    toast.dismiss(loadingId);
    toast.success('Operation completed!');
  } catch (error) {
    toast.dismiss(loadingId);
    toast.error('Operation failed');
  }
};
```

### Custom Options

```jsx
const handleCustomToast = () => {
  toast.success('Custom message', {
    title: 'Custom Title',
    description: 'Additional description text',
    duration: 6000, // 6 seconds
  });
};
```

## Available Methods

### Generic Methods
- `toast.success(message, options)`
- `toast.error(message, options)`
- `toast.warning(message, options)`
- `toast.info(message, options)`
- `toast.loading(message, options)`
- `toast.dismiss(id)`

### CRUD Methods
- `toast.createSuccess(message, options)`
- `toast.createError(message, options)`
- `toast.fetchSuccess(message, options)`
- `toast.fetchError(message, options)`
- `toast.updateSuccess(message, options)`
- `toast.updateError(message, options)`
- `toast.deleteSuccess(message, options)`
- `toast.deleteError(message, options)`

### Authentication Methods
- `toast.loginSuccess(message, options)`
- `toast.loginError(message, options)`
- `toast.registerSuccess(message, options)`
- `toast.registerError(message, options)`
- `toast.logoutSuccess(message, options)`

### Event Methods
- `toast.eventCreateSuccess(message, options)`
- `toast.eventCreateError(message, options)`
- `toast.eventUpdateSuccess(message, options)`
- `toast.eventUpdateError(message, options)`
- `toast.eventDeleteSuccess(message, options)`
- `toast.eventDeleteError(message, options)`

### Payment Methods
- `toast.paymentSuccess(message, options)`
- `toast.paymentError(message, options)`
- `toast.paymentProcessing(message, options)`

## Configuration

The toast system is automatically configured and ready to use. The toasts will:

- Appear in the center of the screen
- Auto-dismiss after 4 seconds (configurable)
- Show appropriate icons for each type
- Have consistent styling with your theme
- Support manual dismissal by clicking the X button

## Migration from react-hot-toast

Replace existing `react-hot-toast` usage:

```jsx
// Old way
import toast from 'react-hot-toast';
toast.success('Success message');

// New way
import useCustomToast from '../../utils/customToast';
const toast = useCustomToast();
toast.success('Success message');
```

The custom toast system provides the same API but with centered positioning and better styling for your application.
