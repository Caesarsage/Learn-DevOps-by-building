def first_function(event, context):
  print("The first function has been invoked!!")
  return {
    'statusCode': 200,
    'body': "Hello, World!.\n This is the first function."
  }
