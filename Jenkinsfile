pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        AWS_REGION       = 'eu-west-1'
        AWS_ACCOUNT_ID   = '615471834295'
        AWS_CREDENTIALS  = 'aws-credentials-id'

        EKS_CLUSTER_NAME = 'tastygo-dev'
        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        IMAGE_TAG        = "${BUILD_NUMBER}"
        HELM_RELEASE     = 'tastygo'
        HELM_NAMESPACE   = 'my-zomato-app'
        HELM_CHART       = 'helm/tastygo'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Shubh1220/Zomato-Clone-Microservices.git'
            }
        }

        stage('Check Tools') {
            steps {
                sh 'git --version'
                sh 'node --version'
                sh 'npm --version'
                sh 'docker --version'
                sh 'aws --version'
                sh 'kubectl version --client'
                sh 'helm version'
                sh 'terraform version'
                sh 'trivy --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --no-audit --no-fund'
            }
        }

        stage('Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Application') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Validate Helm Chart') {
            steps {
                sh 'helm lint helm/tastygo'
            }
        }

        stage('Validate Terraform') {
            steps {
                dir('terraform') {
                    sh 'terraform init -backend=false'
                    sh 'terraform validate'
                }
            }
        }

        stage('Security Scan') {
            steps {
                sh '''
                    trivy fs \
                        --scanners vuln,secret,misconfig \
                        --format table \
                        .
                '''
            }
        }

        stage('Build All 5 Images') {
            steps {
                sh """
                docker build -t ${ECR_REGISTRY}/tastygo/gateway:${IMAGE_TAG} ./gateway
                docker build -t ${ECR_REGISTRY}/tastygo/user-service:${IMAGE_TAG} ./user-service
                docker build -t ${ECR_REGISTRY}/tastygo/product-service:${IMAGE_TAG} ./product-service
                docker build -t ${ECR_REGISTRY}/tastygo/order-service:${IMAGE_TAG} ./order-service
                docker build -t ${ECR_REGISTRY}/tastygo/frontend:${IMAGE_TAG} ./frontend
                """
            }
        }

        stage('Scan All 5 Images') {
            steps {
                sh """
                trivy image --exit-code 1 --severity HIGH,CRITICAL ${ECR_REGISTRY}/tastygo/gateway:${IMAGE_TAG}
                trivy image --exit-code 1 --severity HIGH,CRITICAL ${ECR_REGISTRY}/tastygo/user-service:${IMAGE_TAG}
                trivy image --exit-code 1 --severity HIGH,CRITICAL ${ECR_REGISTRY}/tastygo/product-service:${IMAGE_TAG}
                trivy image --exit-code 1 --severity HIGH,CRITICAL ${ECR_REGISTRY}/tastygo/order-service:${IMAGE_TAG}
                trivy image --exit-code 1 --severity HIGH,CRITICAL ${ECR_REGISTRY}/tastygo/frontend:${IMAGE_TAG}
                """
            }
        }

        stage('Login to ECR') {
            steps {
                withAWS(
                    credentials: "${AWS_CREDENTIALS}",
                    region: "${AWS_REGION}"
                ) {
                    sh """
                        aws ecr get-login-password \
                            --region ${AWS_REGION} |
                        docker login \
                            --username AWS \
                            --password-stdin ${ECR_REGISTRY}
                    """
                }
            }
        }

        stage('Push All 5 Images to ECR') {
            steps {
                sh """
                    docker push ${ECR_REGISTRY}/tastygo/gateway:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/tastygo/user-service:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/tastygo/product-service:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/tastygo/order-service:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/tastygo/frontend:${IMAGE_TAG}
                    """
            }
        }

        stage('Deploy to EKS with Helm') {
            steps {
                withAWS(
                    credentials: "${AWS_CREDENTIALS}",
                    region: "${AWS_REGION}"
                ) {
                    sh """
                        aws eks update-kubeconfig \
                            --region ${AWS_REGION} \
                            --name ${EKS_CLUSTER_NAME}
                    """

                    sh 'kubectl get nodes'

                    sh 'helm lint helm/tastygo'

                    sh """
                        helm upgrade ${HELM_RELEASE} ${HELM_CHART} \
                            --namespace ${HELM_NAMESPACE} \
                            --set image.tag=${IMAGE_TAG} \
                            --wait \
                            --timeout 5m
                    """

                    sh """
                        kubectl rollout status deployment \
                            --namespace ${HELM_NAMESPACE} \
                            --timeout=5m
                    """

                    sh """
                        helm status ${HELM_RELEASE} \
                            --namespace ${HELM_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished. Check the stage results above.'
        }

        success {
            echo 'TastyGo pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check the failed stage logs.'
        }
    }
}
