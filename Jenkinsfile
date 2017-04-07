pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh "$WORKSPACE/conf/scripts/install.sh"
            }
        }
        stage('Test') {
            steps {
                sh 'npm run test'
                sh 'npm run coverage'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
