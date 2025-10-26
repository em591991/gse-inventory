# backend/users/oauth_views.py
# Microsoft OAuth authentication endpoints

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import requests

from .models import User, OAuthIdentity


@api_view(['POST'])
@permission_classes([AllowAny])
def microsoft_auth(request):
    """
    Accept Microsoft access token and create/login user
    
    Expected request body:
    {
        "access_token": "microsoft_access_token_from_msal"
    }
    """
    access_token = request.data.get('access_token')
    
    if not access_token:
        return Response(
            {'error': 'Access token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get user info from Microsoft Graph using the access token
        graph_response = requests.get(
            'https://graph.microsoft.com/v1.0/me',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if graph_response.status_code != 200:
            return Response(
                {'error': 'Failed to get user info from Microsoft', 'details': graph_response.text},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_info = graph_response.json()
        microsoft_id = user_info.get('id')
        email = user_info.get('mail') or user_info.get('userPrincipalName')
        display_name = user_info.get('displayName', '')
        
        if not microsoft_id or not email:
            return Response(
                {'error': 'Invalid user info from Microsoft'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find or create OAuth identity
        try:
            oauth_identity = OAuthIdentity.objects.get(
                provider='microsoft',
                provider_user_id=microsoft_id
            )
            user = oauth_identity.user
            
            # Update last login
            from django.utils import timezone
            user.last_login_at = timezone.now()
            user.save()
            
        except OAuthIdentity.DoesNotExist:
            # Try to find existing user by email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create new user
                user = User.objects.create(
                    email=email,
                    display_name=display_name,
                    status='ACTIVE'
                )
            
            # Create OAuth identity
            oauth_identity = OAuthIdentity.objects.create(
                user=user,
                provider='microsoft',
                provider_user_id=microsoft_id,
                provider_email=email
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Get user roles
        user_roles = list(user.roles.values_list('role__name', flat=True))
        
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'user_id': str(user.user_id),
                'email': user.email,
                'display_name': user.display_name,
                'status': user.status,
                'roles': user_roles
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {
                'error': 'Authentication failed',
                'details': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def refresh_token(request):
    """
    Refresh JWT access token using refresh token
    
    Expected request body:
    {
        "refresh": "refresh_token"
    }
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response(
            {'error': 'Refresh token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        
        return Response({
            'access_token': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {
                'error': 'Invalid refresh token',
                'details': str(e)
            },
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_microsoft_auth_url(request):
    """
    Get the Microsoft OAuth authorization URL for frontend to redirect to
    Not really needed for SPA flow, but keeping for compatibility
    """
    return Response({
        'message': 'Use MSAL browser library for authentication'
    }, status=status.HTTP_200_OK)