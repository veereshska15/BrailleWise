from datetime import datetime

class UserModel:
    """
    Represent a user in the BrailleWise application.
    
    This class defines the schema for a user document stored in MongoDB.
    It includes methods to serialize the object into a dictionary for database
    insertion, and to deserialize database records back into a UserModel instance.
    """
    
    def __init__(self, name, email, password, role="user", created_at=None, _id=None):
        """
        Initialize a new UserModel instance.
        
        Args:
            name (str): The user's full name.
            email (str): The user's email address (unique identifier).
            password (str): The user's password (stored plain/hashed, handled by auth service later).
            role (str, optional): The user's role (e.g., 'user', 'admin'). Defaults to 'user'.
            created_at (datetime, optional): Timestamp of when the user was created. 
                                              Defaults to datetime.utcnow().
            _id (ObjectId/str, optional): MongoDB object identifier if the user is retrieved from the DB.
        """
        self._id = _id
        self.name = name
        self.email = email
        self.password = password
        self.role = role
        # Automatically use datetime.utcnow() if created_at is not provided
        self.created_at = created_at if created_at is not None else datetime.utcnow()

    def to_dict(self):
        """
        Convert the UserModel instance into a dictionary suitable for MongoDB insertion or update.
        
        Returns:
            dict: The serialized user data.
        """
        user_dict = {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "role": self.role,
            "created_at": self.created_at
        }
        
        # Only include _id if it has been assigned/retrieved
        if self._id is not None:
            user_dict["_id"] = self._id
            
        return user_dict

    @classmethod
    def from_dict(cls, data):
        """
        Create a UserModel instance from a dictionary retrieved from MongoDB.
        
        Args:
            data (dict): The dictionary representation of a user document.
            
        Returns:
            UserModel: An instance of UserModel, or None if data is empty/None.
        """
        if not data:
            return None
            
        return cls(
            name=data.get("name"),
            email=data.get("email"),
            password=data.get("password"),
            role=data.get("role", "user"),
            created_at=data.get("created_at"),
            _id=data.get("_id")
        )
