import keyword

def sanitize_to_csharp_identifier(input_string):
    # Step 1: Remove invalid characters and replace spaces with underscores
    sanitized = ''.join(c if c.isalnum() or c == '_' else '_' for c in input_string)
    
    # Step 2: Ensure the first character is a letter or an underscore
    if sanitized and sanitized[0].isdigit():
        sanitized = '_' + sanitized  # Prepend an underscore if it starts with a digit
    
    # Step 3: Check if the sanitized string is a reserved keyword in C#
    if sanitized in keyword.kwlist:
        sanitized = '_' + sanitized  # Prefix with an underscore if it's a reserved keyword
    
    return sanitized